// Author:
//   Evan Thomas Olds
//
// Notes:
//   Created for zyBooks "competition Friday"

import Suggester from './suggester';
import CellSuggestion from './cell-suggestion';

export default class EvanOldsSuggester extends Suggester {
    
    constructor(name, suggestMode) {
        super(name);
        var propProps = { "value": suggestMode, "enumerable": true  };
        Object.defineProperty(this, "suggestMode", propProps);
    }
    
    /**
       Return a random number integer in a range.
       @method _getRandomInt
       @param {Integer} min The minimum in range.
       @param {Integer} max The max in range.
       @return {Integer}
    */
    _getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max) + 1;
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
       Overridden method of base class. Will return a random cell to click.
       @method nextSuggestion
       @param {Game} Game object
       @return {CellSuggestion}
    */
    nextSuggestion(game) {
        // Solve the whole puzzle up front
        var solution = this._solvePuzzle(game.board, true);
        
        if (this.suggestMode === "fishfirst")
        {
            // The first cell that should be a fish, but isn't, is the next suggestion.
            for (var rowIndex = 1; rowIndex < solution.length; rowIndex++)
            {
                var boardRow = game.board[rowIndex];
                var solRow = solution[rowIndex];
                for (var colIndex = 1; colIndex < solRow.length; colIndex++)
                {
                    if (solRow[colIndex].type === "clownfish" &&
                        solRow[colIndex].type != boardRow[colIndex].type)
                        return new CellSuggestion(rowIndex, colIndex);
                }
            }
        }
        
        // The leftmost, incorrect cell in the highest row is the next suggestion.
        for (var rowIndex = 1; rowIndex < solution.length; rowIndex++)
        {
            var boardRow = game.board[rowIndex];
            var solRow = solution[rowIndex];
            for (var colIndex = 1; colIndex < solRow.length; colIndex++)
            {
                if (solRow[colIndex].type != boardRow[colIndex].type)
                    return new CellSuggestion(rowIndex, colIndex);
            }
        }

        // Should never come here unless the puzzle is already solved (or I suppose
        // is unsolvable)
        return new CellSuggestion(1, 1);
    }
    
    // ---- Utility functions follow ----

    // Returns true if the cell borders a coral cell, false otherwise. The row and
    // column indices must be in range.
    _cellBordersCoral(boardArray, rowIndex, colIndex) {
        var deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var delta of deltas)
        {
            var dx = delta[0];
            var dy = delta[1];
            if (this._getCellType(boardArray, rowIndex + dy, colIndex + dx, "water") == "coral")
                return true;
        }
        
        // Coming here means no bordering cells were coral
        return false;
    }
    
    _deepCloneBoard(boardArray) {
        // Clone rows
        var clone = new Array(boardArray.length);
        for (var i = 0; i < boardArray.length; i++)
            clone[i] = this._deepCloneRow(boardArray[i]);
        
        // Add a utility function to get the first empty cell, or null if
        // no empty cells exist in the board.
        clone.getFirstEmptyCell = function()
        {
            for (var row of clone)
            {
                var cell = row.firstCellOfType("empty");
                if (cell != null)
                    return cell;
            }
            return null;
        }
        
        return clone;
    }
    
    // Makes a deep copy of a game board row, which is an array of cells. Row array
    // objects will include the utility function "countCellsOfType(typeString)".
    _deepCloneRow(row) {
        var clone = new Array();
        for (var cell of row)
        {
            var cellClone = new Object();
            for (var propName in cell)
                cellClone[propName] = cell[propName];
            
            // Freeze coral and constraint cells, since they should never be changed
            if (cellClone.type === "coral" ||
                cellClone.type == "constraint")
                Object.freeze(cellClone);
            
            // Push the cloned cell into the array
            clone.push(cellClone);
        }
        
        // Convert row to a "smart cell collection" and return
        return this._makeSmartCellCollection(clone, "row");
    }
    
    _forEachCell(boardArray, callback, callbackThis) {
        if (typeof callbackThis === "undefined")
            callbackThis = this;
        
        for (var row of boardArray)
        {
            for (var cell of row)
                callback.call(callbackThis, cell);
        }
    }
    
    _getCellType(boardArray, rowIndex, colIndex, defaultIfOutOfBounds) {
        // If no default was specified, use "water"
        if (typeof defaultIfOutOfBounds === "undefined")
            defaultIfOutOfBounds = "water";
        
        // Return default if either index is out of bounds
        if (rowIndex >= boardArray.length)
            return defaultIfOutOfBounds;
        if (colIndex >= boardArray[0].length)
            return defaultIfOutOfBounds;
        
        return boardArray[rowIndex][colIndex].type;
    }
    
    // Builds a 1D array of cell references (shallow copies) for the column
    // from the board array. The returned array object will also have utility
    // functions added:
    //   countCellsOfType(typeString)
    _getColumn(boardArr, colIndex) {
        // Build the array
        var result = [];
        for (var row of boardArr)
        {
            result.push(row[colIndex]);
        }
        
        // Convert to a "smart cell collection" and return
        return this._makeSmartCellCollection(result, "column");
    }
    
    // Returns a smart cell collection of cells that surround the specified cell. Here,
    // "surround" means above, below, to the right, or to the left.
    // If includeDiagonals is true, diagonal cells are added as well.
    // The returned collection will have at most 4 cells, or fewer if 'cell' is at an
    // edge or corner.
    // Constraint cells are NOT included.
    _getSurroundingCells(boardArr, cell, includeDiagonals) {
        var rowCount = boardArr.length;
        var colCount = boardArr[0].length;
        
        // First find the cell in the board array
        var arr = [];
        for (var rowIndex = 0; rowIndex < boardArr.length; rowIndex++)
        {
            var row = boardArr[rowIndex];
            for (var colIndex = 0; colIndex < row.length; colIndex++)
            {
                if (row[colIndex] === cell)
                {
                    if (rowIndex > 1)
                        arr.push(boardArr[rowIndex - 1][colIndex]);
                    if (rowIndex < rowCount - 1)
                        arr.push(boardArr[rowIndex + 1][colIndex]);
                    if (colIndex > 1)
                        arr.push(boardArr[rowIndex][colIndex - 1]);
                    if (colIndex < colCount - 1)
                        arr.push(boardArr[rowIndex][colIndex + 1]);
                    
                    if (includeDiagonals === true)
                    {
                        // Add diagonals
                        for (var delta of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
                        {
                            var r = rowIndex + delta[0];
                            var c = colIndex + delta[1];
                            if (r > 0 && c > 0 && r < rowCount && c < colCount)
                                arr.push(boardArr[r][c]);
                        }
                    }
                    
                    // Found the cell, so break
                    break;
                }
            }
        }
        
        return this._makeSmartCellCollection(arr, "surrounding");
    }
    
    _makeSmartCellCollection(arr, label) {
        // Add the label
        Object.defineProperty(arr, "label", {
            "value": label,
            "enumerable": true
        });
        
        // Add the utility functions
        arr.countCellsOfType = function(typeString) {
            var count = 0;
            for (var cell of arr)
            {
                if (cell.type == typeString)
                    count++;
            }
            return count;
        };
        arr.firstCellOfType = function(typeString) {
            for (var cell of arr)
            {
                if (cell.type == typeString)
                    return cell;
            }
            return null;
        };
        
        return arr;
    }
    
    // Returns a 2D array the same size as the game board, with each
    // cell filled in with the correct answer.
    _solvePuzzle(fullBoard, resetFirst) {
        // First deep clone the board
        fullBoard = this._deepCloneBoard(fullBoard);
        
        // If requested, reset
        if (resetFirst)
        {
            // The board could very well contain "incorrect" cells from the user.
            // Thefore, all cells that aren't either constraints or coral will
            // have the type reset to "empty".
            var resetTypeFunc = function(cell)
            {
                if (cell.type != "constraint" && cell.type != "coral")
                    cell.type = "empty";
            };
            this._forEachCell(fullBoard, resetTypeFunc, this);
        }
        
        // Try to solve with logic
        var res = this._tryLogicSolve(fullBoard);
        var solution = res.board;
            
        // If solved, we're done
        if (res.solved)
            return res.board;
        
        // Deep clone the board, which is assumed to be correct so far,
        // but not complete
        var boardClone = this._deepCloneBoard(solution);
        
        // Should the solve with logic fail, make a guess on the first
        // empty cell, and try again.
        var firstEmpty = boardClone.getFirstEmptyCell();
        
        // No empty cells and not solved means no solution. Return null
        // in this case.
        if (firstEmpty == null)
            return null;
        
        // Make the first empty cell water, and attempt to solve again
        firstEmpty.type = "water";
        var solveAttempt = this._solvePuzzle(boardClone, false);
        
        // If the returned board is null, no solution was found. That only leaves
        // water as the other possibility for the first empty cell.
        if (solveAttempt == null)
        {
            // Re-clone correct board
            boardClone = this._deepCloneBoard(solution);
            // Get the first empty cell
            firstEmpty = boardClone.getFirstEmptyCell();
            if (firstEmpty != null)
            {
                // Make the type "clownfish" and re-solve
                firstEmpty.type = "clownfish";
                solveAttempt = this._solvePuzzle(boardClone);
            }
        }
        return solveAttempt;
    }
    
    // Returns a 2D array the same size as the game board, with each
    // cell filled in with the correct answer.
    _tryLogicSolve(fullBoard) {
        // Deep clone the game board
        var solution = this._deepCloneBoard(fullBoard);
        
        // The number of colums (including the constraint column) is
        // the length of the first row array
        var colCount = solution[0].length;
        
        // Note for myself:
        // Valid strings for cell "type" property:
        // empty, clownfish, color, constraint, or water
        
        // First pass: Set type to "water" for all non-coral cells in a 0-row
        // (where a "0-row" is a row with a constraint cell having a
        // value of 0)
        for (var row of solution)
        {
            if (row[0].type == "constraint" && row[0].value == 0)
            {
                for (var j = 1; j < row.length; j++)
                {
                    if (row[j].type !== "coral")
                        row[j].type = "water";
                }
            }
        }
        
        // Next pass: Set type to "water" for all non-coral cells in a 0-column
        for (var colIndex = 0; colIndex < colCount; colIndex++)
        {
            var col = this._getColumn(solution, colIndex);
            if (col[0].type == "constraint" && col[0].value == 0)
            {
                for (var j = 1; j < col.length; j++)
                {
                    if (col[j].type !== "coral")
                        col[j].type = "water";
                }
            }
        }
        
        // Each fish must be next to (above, below, left, or right of) a
        // coral cell. Therefore, any cell that doesn't border coral (and
        // also isn't coral itself) must have the type set to "water".
        // Note: row and column indices start at 1 to skip constraint cells
        for (var colIndex = 1; colIndex < colCount; colIndex++)
        {
            for (var rowIndex = 1; rowIndex < solution.length; rowIndex++)
            {
                var cell = solution[rowIndex][colIndex];
                if (cell.type !== "coral" &&
                    !this._cellBordersCoral(solution, rowIndex, colIndex))
                {
                    cell.type = "water";
                    
                    // Freeze the cell, which is known to be correctly solved
                    Object.freeze(cell);
                }
            }
        }
        
        // At this point all non-constraint cells are either fixed as coral, correctly
        // set to water, or empty. All empty cells are unsolved.
        
        // Next pass: try to solve rows and columns with _trySolveRowOrCol
        var madeChanges = true;
        while (madeChanges)
        {
            // Reset the flag
            madeChanges = false;
            
            // Columns
            for (var colIndex = 1; colIndex < colCount; colIndex++)
            {
                var col = this._getColumn(solution, colIndex);
                var res = this._trySolveRowOrCol(col, solution);
                if (res.changed)
                    madeChanges = true;
            }
            
            // Rows
            for (var row of solution)
            {
                var res = this._trySolveRowOrCol(row, solution);
                if (res.changed)
                    madeChanges = true;
            }
        }
        
        // Determine if the puzzle is solved
        var solved = true;
        for (var rowIndex = 1; rowIndex < solution.length; rowIndex++)
        {
            var row = solution[rowIndex];
            // Each row must have no empty cells and the correct number
            // of clown fish
            if (row.countCellsOfType("empty") > 0 ||
                row.countCellsOfType("clownfish") != row[0].value)
            {
                solved = false;
                break;
            }
        }
        for (var colIndex = 1; colIndex < colCount; colIndex++)
        {
            var col = this._getColumn(solution, colIndex);
            // Each column must have no empty cells and the correct number
            // of clown fish
            if (col.countCellsOfType("empty") > 0 ||
                col.countCellsOfType("clownfish") != col[0].value)
            {
                solved = false;
                break;
            }
        }
        for (var rowIndex = 1; rowIndex < solution.length; rowIndex++)
        {
            // Each clown fish cell must be surrounded by 8 non-clown-fish cells
            var row = solution[rowIndex];
            for (var colIndex = 1; colIndex < colCount; colIndex++)
            {
                var cell = row[colIndex];
                if (cell.type === "clownfish")
                {
                    var surrounding = this._getSurroundingCells(solution, cell, true);
                    if (surrounding.firstCellOfType("clownfish") != null)
                    {
                        solved = false;
                        break;
                    }
                }
            }
        }
        
        return { "board": solution, "solved": solved };
    }
    
    // Attempts to solve an array of cells representing a single row or column from
    // the puzzle. The row must be in a state where all "water" and "clownfish" cells
    // are KNOWN to be correctly labeled, and all non-solved cells are "empty".
    //
    // Return value is an object with members "solved" and "changed". Certain cells
    // may be able to be changed to a correct type without solving the entire row
    // or column, hence the "changed" member. Also, if the row is already solved, the
    // "solved" member may be true, while "changed" will be false.
    //
    // Last note: Only logic is used in the solve attempts. No guessing.
    _trySolveRowOrCol(cells, fullBoard) {
        var madeChanges = false;
        
        // Case 1: Collection already has the correct number of clownfish
        var fishCount = cells.countCellsOfType("clownfish");
        if (fishCount == cells[0].value)
        {
            // In this case, all remaining empty cells can be set to "water" and
            // the collection is solved.
            for (var cell of cells)
            {
                if (cell.type === "empty")
                {
                    cell.type = "water";
                    Object.freeze(cell);
                    madeChanges = true;
                }
            }
            
            return { "solved": true, "changed": madeChanges };
        }
        
        // Case 2: The number of empty cells plus the number of fish in the collection
        // equals the total number fish needed.
        // All empty cells can be changed to "clownfish" in this case.
        var emptyCount = cells.countCellsOfType("empty");
        if (emptyCount + fishCount == cells[0].value)
        {
            for (var cell of cells)
            {
                if (cell.type === "empty")
                {
                    cell.type = "clownfish";
                    Object.freeze(cell);
                    madeChanges = true;
                }
            }
            
            return { "solved": true, "changed": madeChanges };
        }
        
        // Case 3: The collection of cells contains a coral cell that lacks a
        // bordering clown fish, and exactly one of the surrounding cells is empty.
        // This implies that the one empty cell must be a fish, since each coral
        // cell needs a bordering fish.
        for (var cell of cells)
        {
            if (cell.type !== "coral")
                continue;
            
            // Get the coral cell's surrounding cells
            var sur = this._getSurroundingCells(fullBoard, cell);
            
            // Skip if a clownfish cell already exists
            if (sur.countCellsOfType("clownfish") > 0)
                continue;
            
            // DEBUG
            if (cell === fullBoard[2][1])
            {
                console.log("breakpoint");
            }
            
            // If no clownfish surrounding, then one is needed. If exactly 1 of
            // the surrounding cells is empty, then that cell needs the fish.
            if (sur.countCellsOfType("empty") == 1)
            {
                var cell = sur.firstCellOfType("empty");
                cell.type = "clownfish";
                Object.freeze(cell);
                
                // A cell outside the collection was changed, so changes were made, but
                // this row or column was not solved.
                return { "solved": false, "changed": true };
            }
        }
        
        // Case 4: The collection contains an empty cell next to a clownfish. Since
        // "Clownfish need their space and should not be adjacent to each other",
        // the empty cell must be water. In this context, the adjacant cells DO
        // include diagonals.
        for (var cell of cells)
        {
            if (cell.type !== "empty")
                continue;
            
            // Get the empty cell's surrounding cells
            var sur = this._getSurroundingCells(fullBoard, cell, true);
            
            // Bug check: no surrounding cells means a bug
            if (sur.length == 0)
                console.error("BUG: Cell in puzzle had no surrounding cells");
            
            // If a clownfish cell already exists, the cell must be water
            if (sur.countCellsOfType("clownfish") > 0)
            {
                cell.type = "water";
                Object.freeze(cell);
                madeChanges = true;
            }
        }
        
        // Coming here means no more logic to apply. The collection is solved only
        // if no empty cells exist.
        return {
            "solved": cells.countCellsOfType("empty") == 0,
            "changed": madeChanges
        };
    }
}
