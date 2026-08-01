import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360AlertsRecord extends FirestoreRecord {
  E360AlertsRecord._(
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
      FirebaseFirestore.instance.collection('e360_alerts');

  static Stream<E360AlertsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360AlertsRecord.fromSnapshot(s));

  static Future<E360AlertsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360AlertsRecord.fromSnapshot(s));

  static E360AlertsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360AlertsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360AlertsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360AlertsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360AlertsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360AlertsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360AlertsRecordData({
  String? status,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'status': status,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360AlertsRecordDocumentEquality implements Equality<E360AlertsRecord> {
  const E360AlertsRecordDocumentEquality();

  @override
  bool equals(E360AlertsRecord? e1, E360AlertsRecord? e2) {
    return e1?.status == e2?.status;
  }

  @override
  int hash(E360AlertsRecord? e) => const ListEquality().hash([e?.status]);

  @override
  bool isValidKey(Object? o) => o is E360AlertsRecord;
}
