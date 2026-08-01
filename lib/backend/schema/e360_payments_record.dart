import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360PaymentsRecord extends FirestoreRecord {
  E360PaymentsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "client_name" field.
  String? _clientName;
  String get clientName => _clientName ?? '';
  bool hasClientName() => _clientName != null;

  // "amount" field.
  double? _amount;
  double get amount => _amount ?? 0.0;
  bool hasAmount() => _amount != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "client_uid" field.
  String? _clientUid;
  String get clientUid => _clientUid ?? '';
  bool hasClientUid() => _clientUid != null;

  void _initializeFields() {
    _clientName = snapshotData['client_name'] as String?;
    _amount = castToType<double>(snapshotData['amount']);
    _status = snapshotData['status'] as String?;
    _clientUid = snapshotData['client_uid'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_payments');

  static Stream<E360PaymentsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360PaymentsRecord.fromSnapshot(s));

  static Future<E360PaymentsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360PaymentsRecord.fromSnapshot(s));

  static E360PaymentsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360PaymentsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360PaymentsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360PaymentsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360PaymentsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360PaymentsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360PaymentsRecordData({
  String? clientName,
  double? amount,
  String? status,
  String? clientUid,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'client_name': clientName,
      'amount': amount,
      'status': status,
      'client_uid': clientUid,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360PaymentsRecordDocumentEquality
    implements Equality<E360PaymentsRecord> {
  const E360PaymentsRecordDocumentEquality();

  @override
  bool equals(E360PaymentsRecord? e1, E360PaymentsRecord? e2) {
    return e1?.clientName == e2?.clientName &&
        e1?.amount == e2?.amount &&
        e1?.status == e2?.status &&
        e1?.clientUid == e2?.clientUid;
  }

  @override
  int hash(E360PaymentsRecord? e) => const ListEquality()
      .hash([e?.clientName, e?.amount, e?.status, e?.clientUid]);

  @override
  bool isValidKey(Object? o) => o is E360PaymentsRecord;
}
