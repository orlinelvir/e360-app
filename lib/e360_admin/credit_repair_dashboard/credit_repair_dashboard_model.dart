import '/backend/backend.dart';
import '/components/credit_case_card_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'credit_repair_dashboard_widget.dart' show CreditRepairDashboardWidget;
import 'package:flutter/material.dart';

class CreditRepairDashboardModel
    extends FlutterFlowModel<CreditRepairDashboardWidget> {
  ///  Local state fields for this page.

  List<E360CreditCasesRecord> casesList = [];
  void addToCasesList(E360CreditCasesRecord item) => casesList.add(item);
  void removeFromCasesList(E360CreditCasesRecord item) =>
      casesList.remove(item);
  void removeAtIndexFromCasesList(int index) => casesList.removeAt(index);
  void insertAtIndexInCasesList(int index, E360CreditCasesRecord item) =>
      casesList.insert(index, item);
  void updateCasesListAtIndex(
          int index, Function(E360CreditCasesRecord) updateFn) =>
      casesList[index] = updateFn(casesList[index]);

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in CreditRepairDashboard widget.
  List<E360CreditCasesRecord>? loadedCases;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;
  // Models for CreditCaseCard.
  late FlutterFlowDynamicModels<CreditCaseCardModel> creditCaseCardModels;

  @override
  void initState(BuildContext context) {
    creditCaseCardModels =
        FlutterFlowDynamicModels(() => CreditCaseCardModel());
  }

  @override
  void dispose() {
    textFieldFocusNode?.dispose();
    textController?.dispose();

    creditCaseCardModels.dispose();
  }
}
