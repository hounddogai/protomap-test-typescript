import * as text from "../../../../kit/text.js";
import { SeasonalWindowBundle } from "./seasonal-window-bundle.js";

/** How screens and exports show a seasonal window bundle. */
export class SeasonalWindowBundleView {
  code: string;
  titleText: string;
  sourceText: string;
  audienceId: string;
  batchSize: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sourceText: string,
    audienceId: string,
    batchSize: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sourceText = sourceText;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalWindowBundleView(item: SeasonalWindowBundle): SeasonalWindowBundleView {
  return new SeasonalWindowBundleView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.source, 40),
    item.audienceId,
    String(item.batchSize),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalWindowBundleViews(items: SeasonalWindowBundle[]): SeasonalWindowBundleView[] {
  const views: SeasonalWindowBundleView[] = [];
  for (const item of items) {
    views.push(toSeasonalWindowBundleView(item));
  }
  return views;
}

export function sumSeasonalWindowBundleView(view: SeasonalWindowBundleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
