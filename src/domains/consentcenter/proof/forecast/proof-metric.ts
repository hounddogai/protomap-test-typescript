import * as text from "../../../../kit/text.js";

/** Where a proof metric is in its life cycle. */
export type ProofMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** One proof metric, with what the planners need to act on it. */
export class ProofMetric {
  code: string;
  label: string;
  cohort: string;
  journeyId: string;
  audienceId: string;
  attributes: Map<string, string>;
  externalRef: string;
  impressions: number;
  name: string;
  currency: string;
  status: ProofMetricStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    journeyId: string,
    audienceId: string,
    attributes: Map<string, string>,
    externalRef: string,
    impressions: number,
    name: string,
    currency: string,
    status: ProofMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.name = name;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): ProofMetric {
    return new ProofMetric(
      this.code,
      this.label,
      this.cohort,
      this.journeyId,
      this.audienceId,
      this.attributes,
      this.externalRef,
      this.impressions,
      this.name,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a proof metric in status requested. */
export function newProofMetric(code: string, label: string): ProofMetric {
  return new ProofMetric(code, label, "", "", "", new Map<string, string>(), "", 0, "", "", "requested");
}
