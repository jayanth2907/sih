import datetime
from sqlalchemy.orm import Session
from app.models import Mine, Violation, Inspection, ExternalActivity, ViolationStatusEnum

def get_recurrence_count(db: Session, mine_id: int, regulation_id: int, window_days: int = 30) -> int:
    """
    Count Violation rows for that mine + regulation created within the window.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=window_days)
    count = db.query(Violation).filter(
        Violation.mine_id == mine_id,
        Violation.regulation_id == regulation_id,
        Violation.created_at >= cutoff
    ).count()
    return count

def get_inspection_gap_days(db: Session, mine_id: int) -> int:
    """
    Days since the mine's most recent Inspection.inspection_time, compared against
    Mine.inspection_frequency_days.
    """
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    expected_freq = mine.inspection_frequency_days if (mine and mine.inspection_frequency_days) else 7

    last_insp = db.query(Inspection).filter(
        Inspection.mine_id == mine_id
    ).order_by(Inspection.inspection_time.desc()).first()

    now = datetime.datetime.utcnow()
    if last_insp and last_insp.inspection_time:
        days_since = (now - last_insp.inspection_time).days
    elif mine and mine.created_at:
        days_since = (now - mine.created_at).days
    else:
        days_since = expected_freq

    gap_days = max(0, days_since - expected_freq)
    return gap_days

def get_open_violation_count(db: Session, mine_id: int) -> int:
    """
    Count Violation rows for that mine where status != CLOSED.
    """
    count = db.query(Violation).filter(
        Violation.mine_id == mine_id,
        Violation.status != ViolationStatusEnum.CLOSED
    ).count()
    return count

def get_site_violation_rate(db: Session, mine_id: int) -> float:
    """
    Compute open_violation_count / total violations ever for that mine.
    """
    total = db.query(Violation).filter(Violation.mine_id == mine_id).count()
    if total == 0:
        return 0.0
    open_count = get_open_violation_count(db, mine_id)
    return round(open_count / float(total), 2)

def get_reporting_drift(db: Session, mine_id: int) -> float:
    """
    Compute from Mine.reporting_frequency_actual vs Mine.reporting_frequency_expected,
    e.g. max(0.0, 1 - (actual/expected)), clamped to [0.0, 1.0].
    """
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        return 0.0
    expected = max(mine.reporting_frequency_expected or 10, 1)
    actual = mine.reporting_frequency_actual if mine.reporting_frequency_actual is not None else 0
    drift = max(0.0, 1.0 - (actual / float(expected)))
    return round(min(max(drift, 0.0), 1.0), 2)

def get_external_discrepancy(db: Session, mine_id: int) -> bool:
    """
    Check ExternalActivity records for unexplained satellite activity signals
    against reporting silence. Return False if no signal exists, do not fabricate True.
    """
    ext_signals = db.query(ExternalActivity).filter(
        ExternalActivity.mine_id == mine_id,
        ExternalActivity.activity_detected == True
    ).all()
    if not ext_signals:
        return False

    drift = get_reporting_drift(db, mine_id)
    return drift > 0.2
