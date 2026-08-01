import '/flutter_flow/flutter_flow_util.dart';
import 'credit_repair_dashboard_widget.dart' show CreditRepairDashboardWidget;
import 'package:flutter/material.dart';

class CreditRepairDashboardModel
    extends FlutterFlowModel<CreditRepairDashboardWidget> {
  ///  State fields for stateful widgets in this page.

  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldFocusNode?.dispose();
    textController?.dispose();
  }
}
