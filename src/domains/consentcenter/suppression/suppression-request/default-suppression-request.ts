/**
 * The default suppression request records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default suppression request is in its life cycle. */
export type DefaultSuppressionRequestStatus = "created" | "validated" | "published" | "retired";

/** One default suppression request, with what the planners need to act on it. */
export class DefaultSuppressionRequest {
  code: string;
  title: string;
  archived: boolean;
  label: string;
  campaignRef: string;
  budget: number;
  variant: string;
  country: string;
  journeyId: string;
  status: DefaultSuppressionRequestStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    label: string,
    campaignRef: string,
    budget: number,
    variant: string,
    country: string,
    journeyId: string,
    status: DefaultSuppressionRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.variant = variant;
    this.country = country;
    this.journeyId = journeyId;
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

  canMoveTo(next: DefaultSuppressionRequestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: DefaultSuppressionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default suppression request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): DefaultSuppressionRequest {
    return new DefaultSuppressionRequest(
      this.code,
      this.title,
      this.archived,
      this.label,
      this.campaignRef,
      this.budget,
      this.variant,
      this.country,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a default suppression request in status created. */
export function newDefaultSuppressionRequest(code: string, title: string): DefaultSuppressionRequest {
  return new DefaultSuppressionRequest(code, title, false, "", "", 0, "", "", "", "created");
}
