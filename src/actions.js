// Action types in game.
export const CLICK_CELL = 'CLICK_CELL';
export const CHANGE_GAME_INDEX = 'GAME_INDEX';
export const RESET_GAME = 'RESET_GAME';
export const CHANGE_SUGGESTER = 'CHANGE_SUGGESTER';
export const CHANGE_NUM_SUGGESTIONS = 'CHANGE_NUM_SUGGESTIONS';

// Simple action creators for game.
export function clickCell(cell) {
    return {
        type: CLICK_CELL,
        row: cell.row,
        column: cell.column,
    };
}

export function changeIndex(index) {
    return {
        type: CHANGE_GAME_INDEX,
        index,
    };
}

export function resetGame(index) {
    return {
        type: RESET_GAME,
        index,
    };
}

export function changeSuggester(suggester) {
    return {
        type: CHANGE_SUGGESTER,
        suggester,
    };
}

export function changeNumSuggestions(numSuggestions) {
    return {
        type: CHANGE_NUM_SUGGESTIONS,
        numSuggestions,
    };
}




