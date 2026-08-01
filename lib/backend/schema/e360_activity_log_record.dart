import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class E360ActivityLogRecord extends FirestoreRecord {
  E360ActivityLogRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "client_uid" field.
  String? _clientUid;
  String get clientUid => _clientUid ?? '';
  bool hasClientUid() => _clientUid != null;

  // "action_type" field.
  String? _actionType;
  String get actionType => _actionType ?? '';
  bool hasActionType() => _actionType != null;

  // "actor_uid" field.
  String? _actorUid;
  String get actorUid => _actorUid ?? '';
  bool hasActorUid() => _actorUid != null;

  // "is_admin_action" field.
  bool? _isAdminAction;
  bool get isAdminAction => _isAdminAction ?? false;
  bool hasIsAdminAction() => _isAdminAction != null;

  // "notes" field.
  String? _notes;
  String get notes => _notes ?? '';
  bool hasNotes() => _notes != null;

  // "timestamp" field.
  DateTime? _timestamp;
  DateTime? get timestamp => _timestamp;
  bool hasTimestamp() => _timestamp != null;

  void _initializeFields() {
    _clientUid = snapshotData['client_uid'] as String?;
    _actionType = snapshotData['action_type'] as String?;
    _actorUid = snapshotData['actor_uid'] as String?;
    _isAdminAction = snapshotData['is_admin_action'] as bool?;
    _notes = snapshotData['notes'] as String?;
    _timestamp = snapshotData['timestamp'] as DateTime?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_activity_log');

  static Stream<E360ActivityLogRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360ActivityLogRecord.fromSnapshot(s));

  static Future<E360ActivityLogRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360ActivityLogRecord.fromSnapshot(s));

  static E360ActivityLogRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360ActivityLogRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360ActivityLogRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360ActivityLogRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360ActivityLogRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360ActivityLogRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360ActivityLogRecordData({
  String? clientUid,
  String? actionType,
  String? actorUid,
  bool? isAdminAction,
  String? notes,
  DateTime? timestamp,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'client_uid': clientUid,
      'action_type': actionType,
      'actor_uid': actorUid,
      'is_admin_action': isAdminAction,
      'notes': notes,
      'timestamp': timestamp,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360ActivityLogRecordDocumentEquality
    implements Equality<E360ActivityLogRecord> {
  const E360ActivityLogRecordDocumentEquality();

  @override
  bool equals(E360ActivityLogRecord? e1, E360ActivityLogRecord? e2) {
    return e1?.clientUid == e2?.clientUid &&
        e1?.actionType == e2?.actionType &&
        e1?.actorUid == e2?.actorUid &&
        e1?.isAdminAction == e2?.isAdminAction &&
        e1?.notes == e2?.notes &&
        e1?.timestamp == e2?.timestamp;
  }

  @override
  int hash(E360ActivityLogRecord? e) => const ListEquality().hash([
        e?.clientUid,
        e?.actionType,
        e?.actorUid,
        e?.isAdminAction,
        e?.notes,
        e?.timestamp
      ]);

  @override
  bool isValidKey(Object? o) => o is E360ActivityLogRecord;
}
