/**
 * stateMachine.js
 * Finite State Machine (FSM) for managing game states.
 *
 * STATES: MENU -> PLAYING <-> PAUSED | PLAYING -> GAME_OVER -> PLAYING
 * TIME  COMPLEXITY: O(1) for all transitions.
 * SPACE COMPLEXITY: O(S) where S = number of states (4).
 */

const GameState = Object.freeze({
  MENU:      'MENU',
  PLAYING:   'PLAYING',
  PAUSED:    'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

class StateMachine {
  constructor() {
    this.current = GameState.MENU;

    // Legal transition table - enforces valid state changes
    this._transitions = {
      [GameState.MENU]:      [GameState.PLAYING],
      [GameState.PLAYING]:   [GameState.PAUSED, GameState.GAME_OVER],
      [GameState.PAUSED]:    [GameState.PLAYING, GameState.MENU],
      [GameState.GAME_OVER]: [GameState.PLAYING, GameState.MENU],
    };

    this._enterCallbacks = {};
    this._exitCallbacks  = {};
  }

  onEnter(state, fn) {
    if (!this._enterCallbacks[state]) this._enterCallbacks[state] = [];
    this._enterCallbacks[state].push(fn);
  }

  onExit(state, fn) {
    if (!this._exitCallbacks[state]) this._exitCallbacks[state] = [];
    this._exitCallbacks[state].push(fn);
  }

  /**
   * Attempt a state transition.
   * @param {string} nextState
   * @returns {boolean} True if successful.
   */
  transition(nextState) {
    const allowed = this._transitions[this.current];
    if (!allowed || !allowed.includes(nextState)) {
      console.warn('[FSM] Illegal transition: ' + this.current + ' -> ' + nextState);
      return false;
    }
    (this._exitCallbacks[this.current] || []).forEach(fn => fn());
    const previous = this.current;
    this.current = nextState;
    (this._enterCallbacks[nextState] || []).forEach(fn => fn(previous));
    return true;
  }

  is(state) { return this.current === state; }
}
