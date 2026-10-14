import * as text from "../../../../kit/text.js";

/** Where a default pacing variance is in its life cycle. */
export type DefaultPacingVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default pacing variance as the pacing team keeps it. */
export class DefaultPacingVariance {
  code: string;
  name: string;
  discount: number;
  priority: number;
  summary: string;
  archived: boolean;
  description: string;
  attributes: Map<string, string>;
  clicks: number;
  variant: string;
  status: DefaultPacingVarianceStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    priority: number,
    summary: string,
    archived: boolean,
    description: string,
    attributes: Map<string, string>,
    clicks: number,
    variant: string,
    status: DefaultPacingVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.priority = priority;
    this.summary = summary;
    this.archived = archived;
    this.description = description;
    this.attributes = attributes;
    this.clicks = clicks;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultPacingVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPacingVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default pacing variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.discount - this.priority) * 100) / 100;
  }

  copy(): DefaultPacingVariance {
    return new DefaultPacingVariance(
      this.code,
      this.name,
      this.discount,
      this.priority,
      this.summary,
      this.archived,
      this.description,
      this.attributes,
      this.clicks,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default pacing variance in status idle. */
export function newDefaultPacingVariance(code: string, name: string): DefaultPacingVariance {
  return new DefaultPacingVariance(code, name, 0, 0, "", false, "", new Map<string, string>(), 0, "", "idle");
}
