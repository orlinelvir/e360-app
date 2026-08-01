import '/flutter_flow/flutter_flow_util.dart';
import 'portafoliodel_broker_widget.dart' show PortafoliodelBrokerWidget;
import 'package:flutter/material.dart';

class PortafoliodelBrokerModel
    extends FlutterFlowModel<PortafoliodelBrokerWidget> {
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
