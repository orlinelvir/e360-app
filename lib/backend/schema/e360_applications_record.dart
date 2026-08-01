import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360ApplicationsRecord extends FirestoreRecord {
  E360ApplicationsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "client_name" field.
  String? _clientName;
  String get clientName => _clientName ?? '';
  bool hasClientName() => _clientName != null;

  // "broker_uid" field.
  String? _brokerUid;
  String get brokerUid => _brokerUid ?? '';
  bool hasBrokerUid() => _brokerUid != null;

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "client_uid" field.
  String? _clientUid;
  String get clientUid => _clientUid ?? '';
  bool hasClientUid() => _clientUid != null;

  void _initializeFields() {
    _status = snapshotData['status'] as String?;
    _clientName = snapshotData['client_name'] as String?;
    _brokerUid = snapshotData['broker_uid'] as String?;
    _createdAt = snapshotData['created_at'] as DateTime?;
    _clientUid = snapshotData['client_uid'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_applications');

  static Stream<E360ApplicationsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360ApplicationsRecord.fromSnapshot(s));

  static Future<E360ApplicationsRecord> getDocumentOnce(
          DocumentReference ref) =>
      ref.get().then((s) => E360ApplicationsRecord.fromSnapshot(s));

  static E360ApplicationsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360ApplicationsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360ApplicationsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360ApplicationsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360ApplicationsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360ApplicationsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360ApplicationsRecordData({
  String? status,
  String? clientName,
  String? brokerUid,
  DateTime? createdAt,
  String? clientUid,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'status': status,
      'client_name': clientName,
      'broker_uid': brokerUid,
      'created_at': createdAt,
      'client_uid': clientUid,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360ApplicationsRecordDocumentEquality
    implements Equality<E360ApplicationsRecord> {
  const E360ApplicationsRecordDocumentEquality();

  @override
  bool equals(E360ApplicationsRecord? e1, E360ApplicationsRecord? e2) {
    return e1?.status == e2?.status &&
        e1?.clientName == e2?.clientName &&
        e1?.brokerUid == e2?.brokerUid &&
        e1?.createdAt == e2?.createdAt &&
        e1?.clientUid == e2?.clientUid;
  }

  @override
  int hash(E360ApplicationsRecord? e) => const ListEquality().hash(
      [e?.status, e?.clientName, e?.brokerUid, e?.createdAt, e?.clientUid]);

  @override
  bool isValidKey(Object? o) => o is E360ApplicationsRecord;
}
