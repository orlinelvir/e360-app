import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class BrokersRecord extends FirestoreRecord {
  BrokersRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "balance_due" field.
  double? _balanceDue;
  double get balanceDue => _balanceDue ?? 0.0;
  bool hasBalanceDue() => _balanceDue != null;

  // "phone_number" field.
  String? _phoneNumber;
  String get phoneNumber => _phoneNumber ?? '';
  bool hasPhoneNumber() => _phoneNumber != null;

  // "photo_url" field.
  String? _photoUrl;
  String get photoUrl => _photoUrl ?? '';
  bool hasPhotoUrl() => _photoUrl != null;

  // "email" field.
  String? _email;
  String get email => _email ?? '';
  bool hasEmail() => _email != null;

  // "display_name" field.
  String? _displayName;
  String get displayName => _displayName ?? '';
  bool hasDisplayName() => _displayName != null;

  // "uid" field.
  String? _uid;
  String get uid => _uid ?? '';
  bool hasUid() => _uid != null;

  // "created_time" field.
  DateTime? _createdTime;
  DateTime? get createdTime => _createdTime;
  bool hasCreatedTime() => _createdTime != null;

  void _initializeFields() {
    _status = snapshotData['status'] as String?;
    _balanceDue = castToType<double>(snapshotData['balance_due']);
    _phoneNumber = snapshotData['phone_number'] as String?;
    _photoUrl = snapshotData['photo_url'] as String?;
    _email = snapshotData['email'] as String?;
    _displayName = snapshotData['display_name'] as String?;
    _uid = snapshotData['uid'] as String?;
    _createdTime = snapshotData['created_time'] as DateTime?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('brokers');

  static Stream<BrokersRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => BrokersRecord.fromSnapshot(s));

  static Future<BrokersRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => BrokersRecord.fromSnapshot(s));

  static BrokersRecord fromSnapshot(DocumentSnapshot snapshot) =>
      BrokersRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static BrokersRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      BrokersRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'BrokersRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is BrokersRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createBrokersRecordData({
  String? status,
  double? balanceDue,
  String? phoneNumber,
  String? photoUrl,
  String? email,
  String? displayName,
  String? uid,
  DateTime? createdTime,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'status': status,
      'balance_due': balanceDue,
      'phone_number': phoneNumber,
      'photo_url': photoUrl,
      'email': email,
      'display_name': displayName,
      'uid': uid,
      'created_time': createdTime,
    }.withoutNulls,
  );

  return firestoreData;
}

class BrokersRecordDocumentEquality implements Equality<BrokersRecord> {
  const BrokersRecordDocumentEquality();

  @override
  bool equals(BrokersRecord? e1, BrokersRecord? e2) {
    return e1?.status == e2?.status &&
        e1?.balanceDue == e2?.balanceDue &&
        e1?.phoneNumber == e2?.phoneNumber &&
        e1?.photoUrl == e2?.photoUrl &&
        e1?.email == e2?.email &&
        e1?.displayName == e2?.displayName &&
        e1?.uid == e2?.uid &&
        e1?.createdTime == e2?.createdTime;
  }

  @override
  int hash(BrokersRecord? e) => const ListEquality().hash([
        e?.status,
        e?.balanceDue,
        e?.phoneNumber,
        e?.photoUrl,
        e?.email,
        e?.displayName,
        e?.uid,
        e?.createdTime
      ]);

  @override
  bool isValidKey(Object? o) => o is BrokersRecord;
}
