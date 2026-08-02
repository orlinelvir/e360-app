import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'e360_admin_panel_widget.dart' show E360AdminPanelWidget;
import 'package:flutter/material.dart';

class E360AdminPanelModel extends FlutterFlowModel<E360AdminPanelWidget> {
  ///  Local state fields for this page.

  List<BrokersRecord> brokersList = [];
  void addToBrokersList(BrokersRecord item) => brokersList.add(item);
  void removeFromBrokersList(BrokersRecord item) => brokersList.remove(item);
  void removeAtIndexFromBrokersList(int index) => brokersList.removeAt(index);
  void insertAtIndexInBrokersList(int index, BrokersRecord item) =>
      brokersList.insert(index, item);
  void updateBrokersListAtIndex(int index, Function(BrokersRecord) updateFn) =>
      brokersList[index] = updateFn(brokersList[index]);

  List<E360LoansRecord> loansList = [];
  void addToLoansList(E360LoansRecord item) => loansList.add(item);
  void removeFromLoansList(E360LoansRecord item) => loansList.remove(item);
  void removeAtIndexFromLoansList(int index) => loansList.removeAt(index);
  void insertAtIndexInLoansList(int index, E360LoansRecord item) =>
      loansList.insert(index, item);
  void updateLoansListAtIndex(int index, Function(E360LoansRecord) updateFn) =>
      loansList[index] = updateFn(loansList[index]);

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Firestore Query - Query a collection] action in E360AdminPanel widget.
  List<BrokersRecord>? loadedBrokers;
  // Stores action output result for [Firestore Query - Query a collection] action in E360AdminPanel widget.
  List<E360LoansRecord>? loadedLoans;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
