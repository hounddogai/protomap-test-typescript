/**
 * The reward rule metric records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule metric is in its life cycle. */
export type RewardRuleMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One reward rule metric, with what the planners need to act on it. */
export class RewardRuleMetric {
  code: string;
  title: string;
  ownerId: string;
  reviewer: string;
  audienceId: string;
  phone: string;
  timezone: string;
  segment: string;
  frequencyCap: number;
  attributes: Map<string, string>;
  channel: string;
  status: RewardRuleMetricStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    reviewer: string,
    audienceId: string,
    phone: string,
    timezone: string,
    segment: string,
    frequencyCap: number,
    attributes: Map<string, string>,
    channel: string,
    status: RewardRuleMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.phone = phone;
    this.timezone = timezone;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.attributes = attributes;
    this.channel = channel;
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

  canMoveTo(next: RewardRuleMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RewardRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): RewardRuleMetric {
    return new RewardRuleMetric(
      this.code,
      this.title,
      this.ownerId,
      this.reviewer,
      this.audienceId,
      this.phone,
      this.timezone,
      this.segment,
      this.frequencyCap,
      this.attributes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reward rule metric in status idle. */
export function newRewardRuleMetric(code: string, title: string): RewardRuleMetric {
  return new RewardRuleMetric(code, title, "", "", "", "", "", "", 0, new Map<string, string>(), "", "idle");
}
