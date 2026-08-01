import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360DocumentsRecord extends FirestoreRecord {
  E360DocumentsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "client_name" field.
  String? _clientName;
  String get clientName => _clientName ?? '';
  bool hasClientName() => _clientName != null;

  // "document_name" field.
  String? _documentName;
  String get documentName => _documentName ?? '';
  bool hasDocumentName() => _documentName != null;

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
    _documentName = snapshotData['document_name'] as String?;
    _status = snapshotData['status'] as String?;
    _clientUid = snapshotData['client_uid'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_documents');

  static Stream<E360DocumentsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360DocumentsRecord.fromSnapshot(s));

  static Future<E360DocumentsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360DocumentsRecord.fromSnapshot(s));

  static E360DocumentsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360DocumentsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360DocumentsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360DocumentsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360DocumentsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360DocumentsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360DocumentsRecordData({
  String? clientName,
  String? documentName,
  String? status,
  String? clientUid,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'client_name': clientName,
      'document_name': documentName,
      'status': status,
      'client_uid': clientUid,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360DocumentsRecordDocumentEquality
    implements Equality<E360DocumentsRecord> {
  const E360DocumentsRecordDocumentEquality();

  @override
  bool equals(E360DocumentsRecord? e1, E360DocumentsRecord? e2) {
    return e1?.clientName == e2?.clientName &&
        e1?.documentName == e2?.documentName &&
        e1?.status == e2?.status &&
        e1?.clientUid == e2?.clientUid;
  }

  @override
  int hash(E360DocumentsRecord? e) => const ListEquality()
      .hash([e?.clientName, e?.documentName, e?.status, e?.clientUid]);

  @override
  bool isValidKey(Object? o) => o is E360DocumentsRecord;
}
