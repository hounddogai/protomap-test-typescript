import * as text from "../../../../kit/text.js";

/** Where a model summary is in its life cycle. */
export type ModelSummaryStatus = "created" | "validated" | "published" | "retired";

/** A model summary. Its code is unique within a tenant. */
export class ModelSummary {
  code: string;
  title: string;
  description: string;
  label: string;
  windowDays: number;
  threshold: number;
  attributes: Map<string, string>;
  cost: number;
  status: ModelSummaryStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    label: string,
    windowDays: number,
    threshold: number,
    attributes: Map<string, string>,
    cost: number,
    status: ModelSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.label = label;
    this.windowDays = windowDays;
    this.threshold = threshold;
    this.attributes = attributes;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.windowDays + this.threshold) * 100) / 100;
  }

  copy(): ModelSummary {
    return new ModelSummary(
      this.code,
      this.title,
      this.description,
      this.label,
      this.windowDays,
      this.threshold,
      this.attributes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a model summary in status created. */
export function newModelSummary(code: string, title: string): ModelSummary {
  return new ModelSummary(code, title, "", "", 0, 0, new Map<string, string>(), 0, "created");
}
