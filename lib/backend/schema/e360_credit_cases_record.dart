import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// One credit-repair case per client (brokers being repaired themselves, or a
/// broker's own end client) — current dispute round and tri-bureau scores.
class E360CreditCasesRecord extends FirestoreRecord {
  E360CreditCasesRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "client_name" field.
  String? _clientName;
  String get clientName => _clientName ?? '';
  bool hasClientName() => _clientName != null;

  // "round_number" field.
  int? _roundNumber;
  int get roundNumber => _roundNumber ?? 0;
  bool hasRoundNumber() => _roundNumber != null;

  // "round_day" field.
  int? _roundDay;
  int get roundDay => _roundDay ?? 0;
  bool hasRoundDay() => _roundDay != null;

  // "round_length_days" field.
  int? _roundLengthDays;
  int get roundLengthDays => _roundLengthDays ?? 0;
  bool hasRoundLengthDays() => _roundLengthDays != null;

  // "next_action_date" field.
  DateTime? _nextActionDate;
  DateTime? get nextActionDate => _nextActionDate;
  bool hasNextActionDate() => _nextActionDate != null;

  // "case_status" field.
  String? _caseStatus;
  String get caseStatus => _caseStatus ?? '';
  bool hasCaseStatus() => _caseStatus != null;

  // "score_transunion" field.
  int? _scoreTransunion;
  int get scoreTransunion => _scoreTransunion ?? 0;
  bool hasScoreTransunion() => _scoreTransunion != null;

  // "score_experian" field.
  int? _scoreExperian;
  int get scoreExperian => _scoreExperian ?? 0;
  bool hasScoreExperian() => _scoreExperian != null;

  // "score_equifax" field.
  int? _scoreEquifax;
  int get scoreEquifax => _scoreEquifax ?? 0;
  bool hasScoreEquifax() => _scoreEquifax != null;

  // "report_url" field.
  String? _reportUrl;
  String get reportUrl => _reportUrl ?? '';
  bool hasReportUrl() => _reportUrl != null;

  void _initializeFields() {
    _clientName = snapshotData['client_name'] as String?;
    _roundNumber = castToType<int>(snapshotData['round_number']);
    _roundDay = castToType<int>(snapshotData['round_day']);
    _roundLengthDays = castToType<int>(snapshotData['round_length_days']);
    _nextActionDate = snapshotData['next_action_date'] as DateTime?;
    _caseStatus = snapshotData['case_status'] as String?;
    _scoreTransunion = castToType<int>(snapshotData['score_transunion']);
    _scoreExperian = castToType<int>(snapshotData['score_experian']);
    _scoreEquifax = castToType<int>(snapshotData['score_equifax']);
    _reportUrl = snapshotData['report_url'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('e360_credit_cases');

  static Stream<E360CreditCasesRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => E360CreditCasesRecord.fromSnapshot(s));

  static Future<E360CreditCasesRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => E360CreditCasesRecord.fromSnapshot(s));

  static E360CreditCasesRecord fromSnapshot(DocumentSnapshot snapshot) =>
      E360CreditCasesRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static E360CreditCasesRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      E360CreditCasesRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'E360CreditCasesRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is E360CreditCasesRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createE360CreditCasesRecordData({
  String? clientName,
  int? roundNumber,
  int? roundDay,
  int? roundLengthDays,
  DateTime? nextActionDate,
  String? caseStatus,
  int? scoreTransunion,
  int? scoreExperian,
  int? scoreEquifax,
  String? reportUrl,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'client_name': clientName,
      'round_number': roundNumber,
      'round_day': roundDay,
      'round_length_days': roundLengthDays,
      'next_action_date': nextActionDate,
      'case_status': caseStatus,
      'score_transunion': scoreTransunion,
      'score_experian': scoreExperian,
      'score_equifax': scoreEquifax,
      'report_url': reportUrl,
    }.withoutNulls,
  );

  return firestoreData;
}

class E360CreditCasesRecordDocumentEquality
    implements Equality<E360CreditCasesRecord> {
  const E360CreditCasesRecordDocumentEquality();

  @override
  bool equals(E360CreditCasesRecord? e1, E360CreditCasesRecord? e2) {
    return e1?.clientName == e2?.clientName &&
        e1?.roundNumber == e2?.roundNumber &&
        e1?.roundDay == e2?.roundDay &&
        e1?.roundLengthDays == e2?.roundLengthDays &&
        e1?.nextActionDate == e2?.nextActionDate &&
        e1?.caseStatus == e2?.caseStatus &&
        e1?.scoreTransunion == e2?.scoreTransunion &&
        e1?.scoreExperian == e2?.scoreExperian &&
        e1?.scoreEquifax == e2?.scoreEquifax &&
        e1?.reportUrl == e2?.reportUrl;
  }

  @override
  int hash(E360CreditCasesRecord? e) => const ListEquality().hash([
        e?.clientName,
        e?.roundNumber,
        e?.roundDay,
        e?.roundLengthDays,
        e?.nextActionDate,
        e?.caseStatus,
        e?.scoreTransunion,
        e?.scoreExperian,
        e?.scoreEquifax,
        e?.reportUrl
      ]);

  @override
  bool isValidKey(Object? o) => o is E360CreditCasesRecord;
}
