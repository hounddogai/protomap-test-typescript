import { PathPolicy } from "./path-policy.js";

/** How screens and exports show a path policy. */
export class PathPolicyView {
  codeText: string;
  title: string;
  source: string;
  retriesText: string;
  quantityText: string;
  segmentText: string;
  summary: string;
  sequence: string;
  visible: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    source: string,
    retriesText: string,
    quantityText: string,
    segmentText: string,
    summary: string,
    sequence: string,
    visible: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.source = source;
    this.retriesText = retriesText;
    this.quantityText = quantityText;
    this.segmentText = segmentText;
    this.summary = summary;
    this.sequence = sequence;
    this.visible = visible;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toPathPolicyView(item: PathPolicy): PathPolicyView {
  return new PathPolicyView(
    item.code,
    item.title,
    item.source,
    String(item.retries),
    String(item.quantity),
    item.segment,
    item.summary,
    String(item.sequence),
    `${item.visible}`,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathPolicyViews(items: PathPolicy[]): PathPolicyView[] {
  const views: PathPolicyView[] = [];
  for (const item of items) {
    views.push(toPathPolicyView(item));
  }
  return views;
}

export function sumPathPolicyView(view: PathPolicyView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRetries + parsedQuantity + parsedSequence;
}
