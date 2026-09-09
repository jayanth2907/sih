class UserModel {
  final int id;
  final String username;
  final String email;
  final String name;
  final String role;
  final int? mineId;
  final String? mineName;
  final String subsidiary;
  final int? contractorId;
  final List<String> permissions;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.name,
    required this.role,
    this.mineId,
    this.mineName,
    this.subsidiary = 'Enterprise Scope',
    this.contractorId,
    this.permissions = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? 'Field Officer',
      role: json['role'] as String? ?? 'INSPECTOR',
      mineId: json['mine_id'] as int?,
      mineName: json['mine_name'] as String?,
      subsidiary: json['subsidiary'] as String? ?? 'Enterprise Scope',
      contractorId: json['contractor_id'] as int?,
      permissions: (json['permissions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'name': name,
      'role': role,
      'mine_id': mineId,
      'mine_name': mineName,
      'subsidiary': subsidiary,
      'contractor_id': contractorId,
      'permissions': permissions,
    };
  }

  bool get isInspector => role == 'INSPECTOR';
  bool get isMineOfficer => role == 'MINE_OFFICER';
  bool get isAdmin => role == 'ADMIN';
  bool get isCorporate => role == 'CORPORATE';
  bool get isRegulator => role == 'REGULATOR';
}
