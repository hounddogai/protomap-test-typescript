import { CappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

/** How screens and exports show a capped fraud check plan. */
export class CappedFraudCheckPlanView {
  codeText: string;
  labelText: string;
  locale: string;
  frequencyCapText: string;
  campaignRef: string;
  visible: string;
  segment: string;
  revisionText: string;
  thresholdText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    locale: string,
    frequencyCapText: string,
    campaignRef: string,
    visible: string,
    segment: string,
    revisionText: string,
    thresholdText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.locale = locale;
    this.frequencyCapText = frequencyCapText;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.segment = segment;
    this.revisionText = revisionText;
    this.thresholdText = thresholdText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFraudCheckPlanView(item: CappedFraudCheckPlan): CappedFraudCheckPlanView {
  return new CappedFraudCheckPlanView(
    item.code,
    item.label,
    item.locale,
    String(item.frequencyCap),
    item.campaignRef,
    `${item.visible}`,
    item.segment,
    String(item.revision),
    item.threshold.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFraudCheckPlanViews(items: CappedFraudCheckPlan[]): CappedFraudCheckPlanView[] {
  const views: CappedFraudCheckPlanView[] = [];
  for (const item of items) {
    views.push(toCappedFraudCheckPlanView(item));
  }
  return views;
}

export function sumCappedFraudCheckPlanView(view: CappedFraudCheckPlanView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedFrequencyCap + parsedRevision + parsedThreshold;
}
