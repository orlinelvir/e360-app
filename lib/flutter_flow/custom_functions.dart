import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'lat_lng.dart';
import 'place.dart';
import 'uploaded_file.dart';
import '/backend/backend.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '/auth/firebase_auth/auth_util.dart';

/// Formats the number of broker records as display text.
String? brokersCountText(List<BrokersRecord>? brokers) {
  return (brokers ?? const []).length.toString();
}

/// Counts loan records matching a status and formats as display text.
String? loansCountByStatusText(
  List<E360LoansRecord>? loans,
  String? status,
) {
  return (loans ?? const []).where((l) => l.status == status).length.toString();
}

/// Formats a case date as "6 de junio, 2026" (app is Spanish-first).
String? formatCaseDateEs(DateTime? date) {
  if (date == null) return '';
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];
  return '${date.day} de ${months[date.month - 1]}, ${date.year}';
}

/// Round label — "Pendiente Ronda 1" before the first round starts, otherwise
/// "Ronda N".
String? roundStageLabel(
  String? status,
  int? roundNumber,
) {
  if (status == 'sin_comenzar') return 'Pendiente Ronda 1';
  return 'Ronda $roundNumber';
}

/// Formats "(Día X/Y)" for the current round.
String? roundDayLabel(
  int? day,
  int? length,
) {
  return '(Día $day/$length)';
}

/// Formats the tri-bureau score row.
String? scoreRowText(
  int? tu,
  int? ex,
  int? eq,
) {
  return 'TU: $tu   EX: $ex   EQ: $eq';
}

/// Status badge text; empty before the first round starts (matches original
/// design).
String? caseStatusLabel(String? status) {
  switch (status) {
    case 'sin_comenzar':
      return '';
    case 'listo_para_actualizar':
      return 'Listo para actualizar';
    default:
      return 'Días pendientes';
  }
}

/// Whether the case is ready for its next update (drives success vs.
///
/// warning color).
bool? caseIsReady(String? status) {
  return status == 'listo_para_actualizar';
}

/// "Comenzar Ronda" before round 1, otherwise "Actualizar Reporte".
String? casePrimaryButtonLabel(String? status) {
  return status == 'sin_comenzar' ? 'Comenzar Ronda' : 'Actualizar Reporte';
}

/// Total number of credit-repair cases being tracked.
String? activeCaseCountText(List<E360CreditCasesRecord>? cases) {
  return (cases ?? const []).length.toString();
}

/// Cases whose next_action_date is before today.
String? overdueCaseCountText(List<E360CreditCasesRecord>? cases) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  var count = 0;
  for (final c in (cases ?? const [])) {
    final next = c.nextActionDate;
    if (next == null) continue;
    final d = DateTime(next.year, next.month, next.day);
    if (d.isBefore(today)) count++;
  }
  return count.toString();
}

/// Cases due today or later (kept as one bucket — the per-card date already
/// shows whether a given case is due today).
String? upcomingCaseCountText(List<E360CreditCasesRecord>? cases) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  var count = 0;
  for (final c in (cases ?? const [])) {
    final next = c.nextActionDate;
    if (next == null) continue;
    final d = DateTime(next.year, next.month, next.day);
    if (!d.isBefore(today)) count++;
  }
  return count.toString();
}
