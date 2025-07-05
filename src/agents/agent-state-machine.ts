import { AgentState, AgentAction, CandidateIntention } from "../types/enums";

/**
 * State transition configuration interface
 */
export interface StateTransition {
  from: AgentState;
  to: AgentState;
  trigger: CandidateIntention;
  condition?: (context: any) => boolean;
}

/**
 * Agent state context interface
 */
export interface AgentStateContext {
  currentState: AgentState;
  previousState?: AgentState;
  candidateId?: string;
  jobId?: string;
  conversationData: Record<string, any>;
  timestamp: Date;
}

/**
 * State machine result interface
 */
export interface StateTransitionResult {
  success: boolean;
  newState: AgentState;
  availableActions: AgentAction[];
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * AgentStateMachine class for managing recruitment conversation flow
 */
export class AgentStateMachine {
  private context: AgentStateContext;
  private readonly stateTransitions: StateTransition[];
  private readonly stateActions: Map<AgentState, AgentAction[]>;

  constructor(initialState: AgentState = AgentState.GREETING) {
    this.context = {
      currentState: initialState,
      conversationData: {},
      timestamp: new Date(),
    };

    this.stateTransitions = this.initializeTransitions();
    this.stateActions = this.initializeStateActions();
  }

  /**
   * Transitions to a new state based on intention
   * @param intention - The detected candidate intention
   * @param context - Additional context for the transition
   * @returns StateTransitionResult
   */
  public transition(intention: CandidateIntention, context?: Record<string, any>): StateTransitionResult {
    const validTransition = this.findValidTransition(intention, context);

    if (!validTransition) {
      return {
        success: false,
        newState: this.context.currentState,
        availableActions: this.getAvailableActions(),
        message: `No valid transition found for intention: ${intention} from state: ${this.context.currentState}`,
      };
    }

    const previousState = this.context.currentState;
    this.context.previousState = previousState;
    this.context.currentState = validTransition.to;
    this.context.timestamp = new Date();

    if (context) {
      this.context.conversationData = { ...this.context.conversationData, ...context };
    }

    return {
      success: true,
      newState: this.context.currentState,
      availableActions: this.getAvailableActions(),
      metadata: {
        previousState,
        transitionTrigger: intention,
        timestamp: this.context.timestamp,
      },
    };
  }

  /**
   * Gets available actions for the current state
   * @returns Array of available actions
   */
  public getAvailableActions(): AgentAction[] {
    return this.stateActions.get(this.context.currentState) || [];
  }

  /**
   * Gets the current state
   * @returns Current agent state
   */
  public getCurrentState(): AgentState {
    return this.context.currentState;
  }

  /**
   * Gets the current context
   * @returns Current agent state context
   */
  public getContext(): AgentStateContext {
    return { ...this.context };
  }

  /**
   * Resets the state machine to initial state
   * @param initialState - The state to reset to
   */
  public reset(initialState: AgentState = AgentState.GREETING): void {
    this.context = {
      currentState: initialState,
      conversationData: {},
      timestamp: new Date(),
    };
  }

  /**
   * Checks if a transition is valid for the current state
   * @param intention - The candidate intention
   * @param context - Additional context
   * @returns boolean
   */
  public canTransition(intention: CandidateIntention, context?: Record<string, any>): boolean {
    return this.findValidTransition(intention, context) !== null;
  }

  /**
   * Forces a state transition (for error handling or admin actions)
   * @param newState - The state to transition to
   * @param reason - Reason for the forced transition
   */
  public forceTransition(newState: AgentState, reason?: string): void {
    this.context.previousState = this.context.currentState;
    this.context.currentState = newState;
    this.context.timestamp = new Date();

    if (reason) {
      this.context.conversationData.forceTransitionReason = reason;
    }
  }

  /**
   * Initializes the state transitions map
   * @returns Array of state transitions
   */
  private initializeTransitions(): StateTransition[] {
    return [
      // Greeting state transitions
      { from: AgentState.GREETING, to: AgentState.JOB_PRESENTATION, trigger: CandidateIntention.JOB_INQUIRY },
      { from: AgentState.GREETING, to: AgentState.Q_AND_A, trigger: CandidateIntention.SALARY_QUESTION },
      { from: AgentState.GREETING, to: AgentState.Q_AND_A, trigger: CandidateIntention.BENEFITS_QUESTION },
      { from: AgentState.GREETING, to: AgentState.JAILBREAK_DETECTED, trigger: CandidateIntention.JAILBREAK_ATTEMPT },

      // Job presentation state transitions
      { from: AgentState.JOB_PRESENTATION, to: AgentState.Q_AND_A, trigger: CandidateIntention.SALARY_QUESTION },
      { from: AgentState.JOB_PRESENTATION, to: AgentState.Q_AND_A, trigger: CandidateIntention.BENEFITS_QUESTION },
      { from: AgentState.JOB_PRESENTATION, to: AgentState.SURVEY, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.JOB_PRESENTATION, to: AgentState.CLOSING, trigger: CandidateIntention.CLOSING_FAREWELL },

      // Q&A state transitions
      { from: AgentState.Q_AND_A, to: AgentState.SURVEY, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.Q_AND_A, to: AgentState.CV_PROCESSING, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.Q_AND_A, to: AgentState.CLOSING, trigger: CandidateIntention.CLOSING_FAREWELL },

      // Survey state transitions
      { from: AgentState.SURVEY, to: AgentState.CV_PROCESSING, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.SURVEY, to: AgentState.TECHNICAL_VALIDATION, trigger: CandidateIntention.TECHNICAL_SKILLS_DISCUSSION },
      { from: AgentState.SURVEY, to: AgentState.CLOSING, trigger: CandidateIntention.CLOSING_FAREWELL },

      // CV processing state transitions
      { from: AgentState.CV_PROCESSING, to: AgentState.TECHNICAL_VALIDATION, trigger: CandidateIntention.TECHNICAL_SKILLS_DISCUSSION },
      { from: AgentState.CV_PROCESSING, to: AgentState.SKILL_ASSESSMENT, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.CV_PROCESSING, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },

      // Technical validation state transitions
      { from: AgentState.TECHNICAL_VALIDATION, to: AgentState.SKILL_ASSESSMENT, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.TECHNICAL_VALIDATION, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },

      // Skill assessment state transitions
      { from: AgentState.SKILL_ASSESSMENT, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.SKILL_ASSESSMENT, to: AgentState.EVALUATION, trigger: CandidateIntention.CLOSING_FAREWELL },

      // Final interview state transitions
      { from: AgentState.FINAL_INTERVIEW, to: AgentState.EVALUATION, trigger: CandidateIntention.CLOSING_FAREWELL },
      { from: AgentState.FINAL_INTERVIEW, to: AgentState.CLOSING, trigger: CandidateIntention.CLOSING_FAREWELL },

      // Evaluation state transitions
      { from: AgentState.EVALUATION, to: AgentState.CLOSING, trigger: CandidateIntention.CLOSING_FAREWELL },

      // Error and jailbreak handling
      { from: AgentState.ERROR, to: AgentState.Q_AND_A, trigger: CandidateIntention.HELP_REQUEST },
      { from: AgentState.JAILBREAK_DETECTED, to: AgentState.Q_AND_A, trigger: CandidateIntention.HELP_REQUEST },

      // Universal transitions (available from any state)
      { from: AgentState.GREETING, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.JOB_PRESENTATION, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.Q_AND_A, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.SURVEY, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.CV_PROCESSING, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.TECHNICAL_VALIDATION, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.SKILL_ASSESSMENT, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
      { from: AgentState.FINAL_INTERVIEW, to: AgentState.ERROR, trigger: CandidateIntention.UNKNOWN },
    ];
  }

  /**
   * Initializes the state actions map
   * @returns Map of states to available actions
   */
  private initializeStateActions(): Map<AgentState, AgentAction[]> {
    const stateActions = new Map<AgentState, AgentAction[]>();

    stateActions.set(AgentState.GREETING, [AgentAction.SEND_GREETING, AgentAction.PRESENT_JOB, AgentAction.REQUEST_CLARIFICATION]);

    stateActions.set(AgentState.JOB_PRESENTATION, [AgentAction.PRESENT_JOB, AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.Q_AND_A, [AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION, AgentAction.REQUEST_CLARIFICATION]);

    stateActions.set(AgentState.SURVEY, [AgentAction.ASK_SURVEY_QUESTION, AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS]);

    stateActions.set(AgentState.CV_PROCESSING, [AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.TECHNICAL_VALIDATION, [
      AgentAction.VALIDATE_TECHNICAL_SKILLS,
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
      AgentAction.ASK_SURVEY_QUESTION,
    ]);

    stateActions.set(AgentState.SKILL_ASSESSMENT, [
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
      AgentAction.CONDUCT_FINAL_INTERVIEW,
      AgentAction.GENERATE_REPORT,
    ]);

    stateActions.set(AgentState.FINAL_INTERVIEW, [AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);

    stateActions.set(AgentState.EVALUATION, [AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);

    stateActions.set(AgentState.CLOSING, [AgentAction.END_CONVERSATION, AgentAction.GENERATE_REPORT]);

    stateActions.set(AgentState.ERROR, [AgentAction.HANDLE_ERROR, AgentAction.REQUEST_CLARIFICATION, AgentAction.SEND_GREETING]);

    stateActions.set(AgentState.JAILBREAK_DETECTED, [AgentAction.BLOCK_JAILBREAK, AgentAction.REQUEST_CLARIFICATION]);

    return stateActions;
  }

  /**
   * Finds a valid transition for the given intention
   * @param intention - The candidate intention
   * @param context - Additional context
   * @returns StateTransition or null
   */
  private findValidTransition(intention: CandidateIntention, context?: Record<string, any>): StateTransition | null {
    const validTransitions = this.stateTransitions.filter(
      (transition) => transition.from === this.context.currentState && transition.trigger === intention,
    );

    // If no transitions found, return null
    if (validTransitions.length === 0) {
      return null;
    }

    // If only one transition, return it
    if (validTransitions.length === 1) {
      const transition = validTransitions[0];
      return !transition.condition || transition.condition(context) ? transition : null;
    }

    // If multiple transitions, find the first one that meets conditions
    for (const transition of validTransitions) {
      if (!transition.condition || transition.condition(context)) {
        return transition;
      }
    }

    return null;
  }
}
