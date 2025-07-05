import { describe, it, expect, beforeEach } from "vitest";
import { AgentStateMachine } from "../../src/agents/agent-state-machine";
import { AgentState, AgentAction, CandidateIntention } from "../../src/types/enums";

describe("AgentStateMachine", () => {
  let stateMachine: AgentStateMachine;

  beforeEach(() => {
    stateMachine = new AgentStateMachine();
  });

  describe("constructor", () => {
    it("should initialize with default GREETING state", () => {
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);
    });

    it("should initialize with custom state when provided", () => {
      const customStateMachine = new AgentStateMachine(AgentState.JOB_PRESENTATION);
      expect(customStateMachine.getCurrentState()).toBe(AgentState.JOB_PRESENTATION);
    });
  });

  describe("getCurrentState", () => {
    it("should return the current state", () => {
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);
    });
  });

  describe("getAvailableActions", () => {
    it("should return available actions for GREETING state", () => {
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.SEND_GREETING, AgentAction.PRESENT_JOB, AgentAction.REQUEST_CLARIFICATION]);
    });

    it("should return available actions for JOB_PRESENTATION state", () => {
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.PRESENT_JOB, AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should return available actions for Q_AND_A state", () => {
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION, AgentAction.REQUEST_CLARIFICATION]);
    });

    it("should return available actions for ERROR state", () => {
      stateMachine.transition(CandidateIntention.UNKNOWN);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.HANDLE_ERROR, AgentAction.REQUEST_CLARIFICATION, AgentAction.SEND_GREETING]);
    });

    it("should return available actions for JAILBREAK_DETECTED state", () => {
      stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.BLOCK_JAILBREAK, AgentAction.REQUEST_CLARIFICATION]);
    });
  });

  describe("transition", () => {
    it("should successfully transition from GREETING to JOB_PRESENTATION", () => {
      const result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.JOB_PRESENTATION);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JOB_PRESENTATION);
    });

    it("should successfully transition from GREETING to Q_AND_A", () => {
      const result = stateMachine.transition(CandidateIntention.SALARY_QUESTION);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.Q_AND_A);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);
    });

    it("should successfully transition from GREETING to JAILBREAK_DETECTED", () => {
      const result = stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.JAILBREAK_DETECTED);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JAILBREAK_DETECTED);
    });

    it("should fail transition for invalid intention", () => {
      const result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);

      expect(result.success).toBe(false);
      expect(result.newState).toBe(AgentState.GREETING);
      expect(result.message).toContain("No valid transition found");
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);
    });

    it("should include metadata in successful transitions", () => {
      const result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.previousState).toBe(AgentState.GREETING);
      expect(result.metadata?.transitionTrigger).toBe(CandidateIntention.JOB_INQUIRY);
      expect(result.metadata?.timestamp).toBeDefined();
    });

    it("should update context with additional data", () => {
      const contextData = { candidateId: "123", jobId: "456" };
      stateMachine.transition(CandidateIntention.JOB_INQUIRY, contextData);

      const context = stateMachine.getContext();
      expect(context.conversationData.candidateId).toBe("123");
      expect(context.conversationData.jobId).toBe("456");
    });
  });

  describe("complex state transitions", () => {
    it("should handle full conversation flow", () => {
      // Start at GREETING
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);

      // Move to JOB_PRESENTATION
      let result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JOB_PRESENTATION);

      // Move to Q_AND_A
      result = stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);

      // Move to SURVEY
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.SURVEY);

      // Move to CV_PROCESSING
      result = stateMachine.transition(CandidateIntention.CV_UPLOAD);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.CV_PROCESSING);

      // Move to TECHNICAL_VALIDATION
      result = stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.TECHNICAL_VALIDATION);

      // Move to SKILL_ASSESSMENT
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.SKILL_ASSESSMENT);

      // Move to FINAL_INTERVIEW
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.FINAL_INTERVIEW);

      // Move to EVALUATION
      result = stateMachine.transition(CandidateIntention.CLOSING_FAREWELL);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.EVALUATION);

      // Move to CLOSING
      result = stateMachine.transition(CandidateIntention.CLOSING_FAREWELL);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.CLOSING);
    });

    it("should handle error transitions from various states", () => {
      const states = [
        AgentState.GREETING,
        AgentState.JOB_PRESENTATION,
        AgentState.Q_AND_A,
        AgentState.SURVEY,
        AgentState.CV_PROCESSING,
        AgentState.TECHNICAL_VALIDATION,
        AgentState.SKILL_ASSESSMENT,
        AgentState.FINAL_INTERVIEW,
      ];

      for (const state of states) {
        const testStateMachine = new AgentStateMachine(state);
        const result = testStateMachine.transition(CandidateIntention.UNKNOWN);

        expect(result.success).toBe(true);
        expect(result.newState).toBe(AgentState.ERROR);
      }
    });

    it("should handle recovery from ERROR state", () => {
      // Move to ERROR state
      stateMachine.transition(CandidateIntention.UNKNOWN);
      expect(stateMachine.getCurrentState()).toBe(AgentState.ERROR);

      // Recover to Q_AND_A
      const result = stateMachine.transition(CandidateIntention.HELP_REQUEST);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);
    });

    it("should handle recovery from JAILBREAK_DETECTED state", () => {
      // Move to JAILBREAK_DETECTED state
      stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JAILBREAK_DETECTED);

      // Recover to Q_AND_A
      const result = stateMachine.transition(CandidateIntention.HELP_REQUEST);
      expect(result.success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);
    });
  });

  describe("canTransition", () => {
    it("should return true for valid transitions", () => {
      expect(stateMachine.canTransition(CandidateIntention.JOB_INQUIRY)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.SALARY_QUESTION)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.JAILBREAK_ATTEMPT)).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      expect(stateMachine.canTransition(CandidateIntention.EXPERIENCE_VALIDATION)).toBe(false);
      expect(stateMachine.canTransition(CandidateIntention.CV_UPLOAD)).toBe(false);
      expect(stateMachine.canTransition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION)).toBe(false);
    });

    it("should validate transitions based on context", () => {
      // Move to JOB_PRESENTATION state
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);

      // These should be valid from JOB_PRESENTATION
      expect(stateMachine.canTransition(CandidateIntention.SALARY_QUESTION)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.BENEFITS_QUESTION)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.EXPERIENCE_VALIDATION)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.CLOSING_FAREWELL)).toBe(true);

      // This should be invalid from JOB_PRESENTATION
      expect(stateMachine.canTransition(CandidateIntention.JOB_INQUIRY)).toBe(false);
    });
  });

  describe("getContext", () => {
    it("should return current context", () => {
      const context = stateMachine.getContext();

      expect(context.currentState).toBe(AgentState.GREETING);
      expect(context.previousState).toBeUndefined();
      expect(context.conversationData).toEqual({});
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it("should update context after transitions", () => {
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      const context = stateMachine.getContext();

      expect(context.currentState).toBe(AgentState.JOB_PRESENTATION);
      expect(context.previousState).toBe(AgentState.GREETING);
    });

    it("should return a copy of the context", () => {
      const context1 = stateMachine.getContext();
      const context2 = stateMachine.getContext();

      expect(context1).not.toBe(context2); // Different objects
      expect(context1).toEqual(context2); // Same content
    });
  });

  describe("reset", () => {
    it("should reset to default GREETING state", () => {
      // Make some transitions
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);

      // Reset
      stateMachine.reset();
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);

      const context = stateMachine.getContext();
      expect(context.previousState).toBeUndefined();
      expect(context.conversationData).toEqual({});
    });

    it("should reset to custom state when provided", () => {
      // Make some transitions
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JOB_PRESENTATION);

      // Reset to custom state
      stateMachine.reset(AgentState.SURVEY);
      expect(stateMachine.getCurrentState()).toBe(AgentState.SURVEY);
    });
  });

  describe("forceTransition", () => {
    it("should force transition to any state", () => {
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);

      stateMachine.forceTransition(AgentState.FINAL_INTERVIEW);
      expect(stateMachine.getCurrentState()).toBe(AgentState.FINAL_INTERVIEW);
    });

    it("should record previous state in forced transition", () => {
      stateMachine.forceTransition(AgentState.ERROR);

      const context = stateMachine.getContext();
      expect(context.previousState).toBe(AgentState.GREETING);
      expect(context.currentState).toBe(AgentState.ERROR);
    });

    it("should record reason for forced transition", () => {
      const reason = "Emergency error handling";
      stateMachine.forceTransition(AgentState.ERROR, reason);

      const context = stateMachine.getContext();
      expect(context.conversationData.forceTransitionReason).toBe(reason);
    });

    it("should update timestamp on forced transition", () => {
      const beforeTime = new Date();
      stateMachine.forceTransition(AgentState.ERROR);
      const afterTime = new Date();

      const context = stateMachine.getContext();
      expect(context.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(context.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe("state actions mapping", () => {
    it("should have correct actions for SURVEY state", () => {
      stateMachine.forceTransition(AgentState.SURVEY);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.ASK_SURVEY_QUESTION, AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS]);
    });

    it("should have correct actions for CV_PROCESSING state", () => {
      stateMachine.forceTransition(AgentState.CV_PROCESSING);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should have correct actions for TECHNICAL_VALIDATION state", () => {
      stateMachine.forceTransition(AgentState.TECHNICAL_VALIDATION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.CONDUCT_SKILL_ASSESSMENT, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should have correct actions for SKILL_ASSESSMENT state", () => {
      stateMachine.forceTransition(AgentState.SKILL_ASSESSMENT);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.CONDUCT_SKILL_ASSESSMENT, AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT]);
    });

    it("should have correct actions for FINAL_INTERVIEW state", () => {
      stateMachine.forceTransition(AgentState.FINAL_INTERVIEW);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);
    });

    it("should have correct actions for EVALUATION state", () => {
      stateMachine.forceTransition(AgentState.EVALUATION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);
    });

    it("should have correct actions for CLOSING state", () => {
      stateMachine.forceTransition(AgentState.CLOSING);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.END_CONVERSATION, AgentAction.GENERATE_REPORT]);
    });

    it("should return empty array for unknown state", () => {
      // Force the state machine to an invalid state to test edge case
      (stateMachine as any).context.currentState = "INVALID_STATE";

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([]);
    });
  });
});
