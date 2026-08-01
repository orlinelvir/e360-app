import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360LoansRecord extends FirestoreRecord {
  E360LoansRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  void _initializeFields() {
    _status = snapshotData['status'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_loans');

  static Stream<E360LoansRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360LoansRecord.fromSnapshot(s));

  static Future<E360LoansRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360LoansRecord.fromSnapshot(s));

  static E360LoansRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360LoansRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360LoansRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360LoansRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360LoansRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360LoansRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360LoansRecordData({
  String? status,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'status': status,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360LoansRecordDocumentEquality implements Equality<E360LoansRecord> {
  const E360LoansRecordDocumentEquality();

  @override
  bool equals(E360LoansRecord? e1, E360LoansRecord? e2) {
    return e1?.status == e2?.status;
  }

  @override
  int hash(E360LoansRecord? e) => const ListEquality().hash([e?.status]);

  @override
  bool isValidKey(Object? o) => o is E360LoansRecord;
}
