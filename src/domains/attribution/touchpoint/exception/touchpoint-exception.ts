/**
 * The touchpoint exception records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint exception is in its life cycle. */
export type TouchpointExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A touchpoint exception. Its code is unique within a tenant. */
export class TouchpointException {
  code: string;
  label: string;
  visible: boolean;
  segment: string;
  audienceId: string;
  ratio: number;
  reviewer: string;
  locale: string;
  status: TouchpointExceptionStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    segment: string,
    audienceId: string,
    ratio: number,
    reviewer: string,
    locale: string,
    status: TouchpointExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.segment = segment;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TouchpointExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): TouchpointException {
    return new TouchpointException(
      this.code,
      this.label,
      this.visible,
      this.segment,
      this.audienceId,
      this.ratio,
      this.reviewer,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a touchpoint exception in status planned. */
export function newTouchpointException(code: string, label: string): TouchpointException {
  return new TouchpointException(code, label, false, "", "", 0, "", "", "planned");
}
