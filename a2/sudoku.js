class Sudoku {
    constructor() {
        this.size = 9;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.solution = null;
        this.difficultyLevels = {
            easy: 35,
            medium: 45,
            hard: 55
        };
    }

    generatePuzzle(difficulty = 'easy') {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        
        this.generateCompleteGrid();
        
        this.solution = this.grid.map(row => [...row]);
        
        const cellsToRemove = this.difficultyLevels[difficulty] || 35;
        this.removeCells(cellsToRemove);
        
        return {
            puzzle: this.grid.map(row => [...row]),
            solution: this.solution
        };
    }

    generateCompleteGrid() {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.grid[i][j] = 0;
            }
        }
        
        this.solveGrid();
    }

    solveGrid() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (let num of numbers) {
                        if (this.isSafe(row, col, num)) {
                            this.grid[row][col] = num;
                            
                            if (this.solveGrid()) {
                                return true;
                            }
                            
                            this.grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isSafe(row, col, num) {
        for (let x = 0; x < this.size; x++) {
            if (this.grid[row][x] === num || this.grid[x][col] === num) {
                return false;
            }
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.grid[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    removeCells(count) {
        let removed = 0;
        const positions = [];
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }
        
        this.shuffle(positions);
        
        for (const [row, col] of positions) {
            if (removed >= count) break;
            
            const backup = this.grid[row][col];
            if (backup === 0) continue;
            
            this.grid[row][col] = 0;
            
            if (this.hasUniqueSolution(this.grid)) {
                removed++;
            } else {
                this.grid[row][col] = backup;
            }
        }
    }

    hasUniqueSolution(grid) {
        const solutions = [];
        const gridCopy = this.deepCopyGrid(grid);
        this.countSolutions(gridCopy, solutions, 2);
        return solutions.length === 1;
    }

    deepCopyGrid(grid) {
        return grid.map(row => [...row]);
    }

    countSolutions(grid, solutions, limit = 2) {
        if (solutions.length >= limit) return;
        
        let empty = null;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === 0) {
                    empty = [i, j];
                    break;
                }
            }
            if (empty) break;
        }
        
        if (!empty) {
            solutions.push(this.deepCopyGrid(grid));
            return;
        }
        
        const [row, col] = empty;
        for (let num = 1; num <= 9; num++) {
            if (this.isSafeForGrid(grid, row, col, num)) {
                grid[row][col] = num;
                this.countSolutions(grid, solutions, limit);
                grid[row][col] = 0;
                
                if (solutions.length >= limit) return;
            }
        }
    }

    isSafeForGrid(grid, row, col, num) {
        for (let x = 0; x < this.size; x++) {
            if (grid[row][x] === num || grid[x][col] === num) {
                return false;
            }
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    solve(grid) {
        const solvedGrid = grid.map(row => [...row]);
        
        if (this.solveHelper(solvedGrid)) {
            return solvedGrid;
        }
        
        return null;
    }

    solveHelper(grid) {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isSafeForGrid(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (this.solveHelper(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(grid) {
        for (let i = 0; i < this.size; i++) {
            const rowSet = new Set();
            const colSet = new Set();
            
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] !== 0) {
                    if (rowSet.has(grid[i][j])) return false;
                    rowSet.add(grid[i][j]);
                }
                
                if (grid[j][i] !== 0) {
                    if (colSet.has(grid[j][i])) return false;
                    colSet.add(grid[j][i]);
                }
            }
        }
        
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const boxSet = new Set();
                
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const num = grid[boxRow * 3 + i][boxCol * 3 + j];
                        if (num !== 0) {
                            if (boxSet.has(num)) return false;
                            boxSet.add(num);
                        }
                    }
                }
            }
        }
        
        return true;
    }

    isComplete(grid) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === 0) {
                    return false;
                }
            }
        }
        return this.isValid(grid);
    }

    getHint(grid) {
        const emptyCells = [];
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push([i, j]);
                }
            }
        }
        
        if (emptyCells.length === 0) return null;
        
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const solvedGrid = this.solve(grid);
        
        if (solvedGrid) {
            return {
                row,
                col,
                value: solvedGrid[row][col]
            };
        }
        
        return null;
    }
}