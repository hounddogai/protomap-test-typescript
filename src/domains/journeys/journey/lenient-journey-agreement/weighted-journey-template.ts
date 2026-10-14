import * as text from "../../../../kit/text.js";

/** Where a weighted journey template is in its life cycle. */
export type WeightedJourneyTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted journey template, with what the planners need to act on it. */
export class WeightedJourneyTemplate {
  code: string;
  label: string;
  retries: number;
  conversionRate: number;
  visible: boolean;
  title: string;
  country: string;
  minimum: number;
  status: WeightedJourneyTemplateStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    conversionRate: number,
    visible: boolean,
    title: string,
    country: string,
    minimum: number,
    status: WeightedJourneyTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.title = title;
    this.country = country;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedJourneyTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedJourneyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted journey template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted journey template"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.conversionRate + this.retries) * 100) / 100;
  }

  copy(): WeightedJourneyTemplate {
    return new WeightedJourneyTemplate(
      this.code,
      this.label,
      this.retries,
      this.conversionRate,
      this.visible,
      this.title,
      this.country,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted journey template in status new. */
export function newWeightedJourneyTemplate(code: string, label: string): WeightedJourneyTemplate {
  return new WeightedJourneyTemplate(code, label, 0, 0, false, "", "", 0, "new");
}
