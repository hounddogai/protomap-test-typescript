import * as text from "../../../../kit/text.js";

/** Where a tiered funnel rule is in its life cycle. */
export type TieredFunnelRuleStatus = "created" | "validated" | "published" | "retired";

/** A tiered funnel rule as the funnel team keeps it. */
export class TieredFunnelRule {
  code: string;
  title: string;
  expiresAt: number;
  margin: number;
  endsAt: number;
  timezone: string;
  description: string;
  source: string;
  weight: number;
  label: string;
  phone: string;
  status: TieredFunnelRuleStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    margin: number,
    endsAt: number,
    timezone: string,
    description: string,
    source: string,
    weight: number,
    label: string,
    phone: string,
    status: TieredFunnelRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.description = description;
    this.source = source;
    this.weight = weight;
    this.label = label;
    this.phone = phone;
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

  canMoveTo(next: TieredFunnelRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFunnelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered funnel rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round((this.weight - this.endsAt) * 100) / 100;
  }

  copy(): TieredFunnelRule {
    return new TieredFunnelRule(
      this.code,
      this.title,
      this.expiresAt,
      this.margin,
      this.endsAt,
      this.timezone,
      this.description,
      this.source,
      this.weight,
      this.label,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered funnel rule in status created. */
export function newTieredFunnelRule(code: string, title: string): TieredFunnelRule {
  return new TieredFunnelRule(code, title, 0, 0, 0, "", "", "", 0, "", "", "created");
}
