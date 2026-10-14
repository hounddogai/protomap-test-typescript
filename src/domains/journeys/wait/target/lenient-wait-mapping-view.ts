import { LenientWaitMapping } from "./lenient-wait-mapping.js";

/** How screens and exports show a lenient wait mapping. */
export class LenientWaitMappingView {
  code: string;
  name: string;
  sendAt: string;
  utmSourceText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAt: string,
    utmSourceText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.utmSourceText = utmSourceText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWaitMappingView(item: LenientWaitMapping): LenientWaitMappingView {
  return new LenientWaitMappingView(
    item.code,
    item.name,
    String(item.sendAt),
    item.utmSource,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWaitMappingViews(items: LenientWaitMapping[]): LenientWaitMappingView[] {
  const views: LenientWaitMappingView[] = [];
  for (const item of items) {
    views.push(toLenientWaitMappingView(item));
  }
  return views;
}

export function sumLenientWaitMappingView(view: LenientWaitMappingView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
