class SudokuGame {
    constructor() {
        this.sudoku = new Sudoku();
        this.currentGrid = null;
        this.solutionGrid = null;
        this.selectedCell = null;
        this.selectedNumber = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.currentDifficulty = 'easy';
        this.isGameActive = false;
        this.isNoteMode = false;
        this.notes = [];
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.generateNewGame();
        this.startTimer();
        this.updateNumberButtonsState();
    }

    cacheElements() {
        this.sudokuGrid = document.getElementById('sudoku-grid');
        this.timerElement = document.getElementById('timer');
        this.mistakesElement = document.getElementById('mistakes-count');
        this.currentDifficultyElement = document.getElementById('current-difficulty');
        
        this.newGameBtn = document.getElementById('new-game');
        this.checkGameBtn = document.getElementById('check-game');
        this.solveGameBtn = document.getElementById('solve-game');
        this.resetGameBtn = document.getElementById('reset-game');
        
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.numberBtns = document.querySelectorAll('.number-btn');
        this.eraseBtn = document.getElementById('erase-btn');
        this.noteModeBtn = document.getElementById('note-mode-btn');
        
        this.messageModal = document.getElementById('message-modal');
        this.messageTitle = document.getElementById('message-title');
        this.messageText = document.getElementById('message-text');
        this.messageClose = document.getElementById('message-close');
    }

    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.generateNewGame());
        this.checkGameBtn.addEventListener('click', () => this.checkGame());
        this.solveGameBtn.addEventListener('click', () => this.getHint());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeDifficulty(e));
        });
        
        this.numberBtns.forEach(btn => {
            if (btn.id !== 'erase-btn') {
                btn.addEventListener('click', (e) => this.selectNumber(e));
            }
        });
        
        this.eraseBtn.addEventListener('click', () => this.eraseNumber());
        this.noteModeBtn.addEventListener('click', () => this.toggleNoteMode());
        
        this.messageClose.addEventListener('click', () => {
            this.messageModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.messageModal) {
                this.messageModal.style.display = 'none';
            }
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    generateNewGame() {
        const { puzzle, solution } = this.sudoku.generatePuzzle(this.currentDifficulty);
        this.currentGrid = puzzle.map(row => [...row]);
        this.solutionGrid = solution;
        
        this.notes = [];
        this.isNoteMode = false;
        this.noteModeBtn.classList.remove('active');
        
        this.mistakes = 0;
        this.updateMistakes();
        this.resetTimer();
        this.renderGrid();
        this.isGameActive = true;
        
        this.showMessage('新游戏开始', `已生成新的${this.getDifficultyName(this.currentDifficulty)}难度数独游戏！`);
    }

    renderGrid() {
        this.sudokuGrid.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.currentGrid[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('fixed');
                }
                
                cell.addEventListener('click', (e) => this.selectCell(e));
                this.sudokuGrid.appendChild(cell);
            }
        }
    }

    selectCell(event) {
        if (!this.isGameActive) return;
        
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        const cellValue = this.currentGrid[row][col];
        
        if (cellValue !== 0 && cell.classList.contains('fixed')) {
            this.clearSelection();
            this.highlightSameNumbers(cellValue);
            return;
        }
        
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            this.clearSelection();
            return;
        }
        
        this.clearSelection();
        
        this.selectedCell = { row, col, element: cell };
        cell.classList.add('selected');
        this.updateNumberButtonsState();
        
        this.selectedNumber = null;
        this.numberBtns.forEach(b => {
            if (b.id !== 'erase-btn') {
                b.classList.remove('selected');
            }
        });
        
        if (cellValue !== 0) {
            this.highlightSameNumbers(cellValue);
        }
    }

    selectNumber(event) {
        if (!this.isGameActive || !this.selectedCell) return;
        
        const btn = event.currentTarget;
        const number = parseInt(btn.dataset.number);
        
        this.selectedNumber = number;
        
        this.numberBtns.forEach(b => {
            if (b.id !== 'erase-btn') {
                b.classList.remove('selected');
            }
        });
        btn.classList.add('selected');
        
        this.placeNumber(number);
    }

    placeNumber(number) {
        if (!this.selectedCell || !this.isGameActive) return;
        
        const { row, col, element } = this.selectedCell;
        
        if (this.currentGrid[row][col] !== 0 && element.classList.contains('fixed')) {
            return;
        }
        
        if (this.isNoteMode && number !== 0) {
            if (this.currentGrid[row][col] === 0) {
                this.addNote(row, col, number);
            }
            return;
        }
        
        this.clearNotes(row, col);
        
        if (number !== 0) {
            this.clearRelatedNotes(row, col, number);
        }
        
        const originalValue = this.currentGrid[row][col];
        this.currentGrid[row][col] = number;
        
        element.textContent = number;
        element.classList.remove('error');
        element.classList.add('user-input');
        
        if (number === 0) {
            element.textContent = '';
            element.classList.remove('user-input');
        }
        
        if (number !== 0 && this.solutionGrid && number !== this.solutionGrid[row][col]) {
            element.classList.add('error');
            this.mistakes++;
            this.updateMistakes();
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameOver();
            }
        }
        
        if (this.sudoku.isComplete(this.currentGrid)) {
            this.gameWon();
        }
    }

    eraseNumber() {
        if (!this.isGameActive || !this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        
        if (this.isNoteMode) {
            this.clearNotes(row, col);
            const cellIndex = row * 9 + col;
            const cell = this.sudokuGrid.children[cellIndex];
            if (cell && this.currentGrid[row][col] === 0) {
                cell.innerHTML = '';
            }
            return;
        }
        
        this.selectedNumber = 0;
        
        this.numberBtns.forEach(b => {
            if (b.id !== 'erase-btn') {
                b.classList.remove('selected');
            }
        });
        
        this.placeNumber(0);
    }

    clearSelection() {
        if (this.selectedCell) {
            this.selectedCell.element.classList.remove('selected');
        }
        this.selectedCell = null;
        this.updateNumberButtonsState();
        this.clearHighlight();
    }

    highlightSameNumbers(number) {
        this.clearHighlight();
        
        const highlightedRows = new Set();
        const highlightedCols = new Set();
        
        for (let i = 0; i < this.sudokuGrid.children.length; i++) {
            const cell = this.sudokuGrid.children[i];
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.currentGrid[row][col] === number) {
                cell.classList.add('highlight-same');
                highlightedRows.add(row);
                highlightedCols.add(col);
            }
        }
        
        for (let i = 0; i < this.sudokuGrid.children.length; i++) {
            const cell = this.sudokuGrid.children[i];
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (highlightedRows.has(row) && !cell.classList.contains('highlight-same')) {
                cell.classList.add('highlight-row');
            }
            
            if (highlightedCols.has(col) && !cell.classList.contains('highlight-same')) {
                cell.classList.add('highlight-col');
            }
        }
    }

    clearHighlight() {
        for (let i = 0; i < this.sudokuGrid.children.length; i++) {
            const cell = this.sudokuGrid.children[i];
            cell.classList.remove('highlight-same', 'highlight-row', 'highlight-col');
        }
    }

    updateNumberButtonsState() {
        const hasSelectedCell = this.selectedCell !== null;
        
        this.numberBtns.forEach(btn => {
            if (hasSelectedCell) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        
        if (this.isNoteMode) {
            this.noteModeBtn.classList.add('active');
        } else {
            this.noteModeBtn.classList.remove('active');
        }
    }

    addNote(row, col, number) {
        if (!this.notes[row]) {
            this.notes[row] = [];
        }
        if (!this.notes[row][col]) {
            this.notes[row][col] = new Set();
        }
        
        if (this.notes[row][col].has(number)) {
            this.notes[row][col].delete(number);
        } else {
            this.notes[row][col].add(number);
        }
        
        this.renderNotes(row, col);
    }

    renderNotes(row, col) {
        const cellIndex = row * 9 + col;
        const cell = this.sudokuGrid.children[cellIndex];
        
        if (!cell) return;
        
        cell.innerHTML = '';
        
        if (this.notes[row] && this.notes[row][col] && this.notes[row][col].size > 0) {
            const notesContainer = document.createElement('div');
            notesContainer.className = 'notes';
            
            for (let i = 1; i <= 9; i++) {
                const noteSpan = document.createElement('span');
                noteSpan.className = 'note';
                if (this.notes[row][col].has(i)) {
                    noteSpan.textContent = i;
                }
                notesContainer.appendChild(noteSpan);
            }
            
            cell.appendChild(notesContainer);
        }
    }

    clearNotes(row, col) {
        if (this.notes[row] && this.notes[row][col]) {
            this.notes[row][col].clear();
        }
    }

    clearRelatedNotes(row, col, number) {
        for (let i = 0; i < 9; i++) {
            if (i !== col && this.notes[row] && this.notes[row][i]) {
                if (this.notes[row][i].has(number)) {
                    this.notes[row][i].delete(number);
                    this.renderNotes(row, i);
                }
            }
        }
        
        for (let i = 0; i < 9; i++) {
            if (i !== row && this.notes[i] && this.notes[i][col]) {
                if (this.notes[i][col].has(number)) {
                    this.notes[i][col].delete(number);
                    this.renderNotes(i, col);
                }
            }
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const r = boxRow + i;
                const c = boxCol + j;
                
                if ((r !== row || c !== col) && this.notes[r] && this.notes[r][c]) {
                    if (this.notes[r][c].has(number)) {
                        this.notes[r][c].delete(number);
                        this.renderNotes(r, c);
                    }
                }
            }
        }
    }

    findFirstEmptyCell() {
        for (let i = 0; i < this.sudokuGrid.children.length; i++) {
            const cell = this.sudokuGrid.children[i];
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.currentGrid[row][col] === 0) {
                return cell;
            }
        }
        return null;
    }

    handleKeyPress(event) {
        if (!this.isGameActive) return;
        
        const key = event.key;
        
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            if (!this.selectedCell) {
                const firstEmptyCell = this.findFirstEmptyCell();
                if (firstEmptyCell) {
                    firstEmptyCell.click();
                }
            }
            if (this.selectedCell) {
                this.selectNumberFromKeyboard(number);
            }
        } else if (key === '0' || key === 'Delete' || key === 'Backspace') {
            this.eraseNumber();
        } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            this.moveSelection(event.key);
            event.preventDefault();
        } else if (key === 'Enter') {
            this.checkGame();
        } else if (key === ' ') {
            this.getHint();
            event.preventDefault();
        } else if (key === 'Escape') {
            this.clearSelection();
            this.selectedNumber = null;
            this.numberBtns.forEach(b => {
                if (b.id !== 'erase-btn') {
                    b.classList.remove('selected');
                }
            });
        }
    }

    selectNumberFromKeyboard(number) {
        if (!this.isGameActive || !this.selectedCell) return;
        
        this.selectedNumber = number;
        
        this.numberBtns.forEach(b => {
            if (b.id !== 'erase-btn') {
                b.classList.remove('selected');
                if (parseInt(b.dataset.number) === number) {
                    b.classList.add('selected');
                }
            }
        });
        
        this.placeNumber(number);
    }

    moveSelection(direction) {
        if (!this.selectedCell) {
            const firstCell = this.sudokuGrid.children[0];
            if (firstCell) {
                firstCell.click();
            }
            return;
        }
        
        let { row, col } = this.selectedCell;
        
        switch (direction) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(8, col + 1);
                break;
        }
        
        const cellIndex = row * 9 + col;
        const cellElement = this.sudokuGrid.children[cellIndex];
        
        if (cellElement) {
            cellElement.click();
        }
    }

    changeDifficulty(event) {
        const btn = event.currentTarget;
        const difficulty = btn.dataset.difficulty;
        
        this.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentDifficulty = difficulty;
        this.currentDifficultyElement.textContent = this.getDifficultyName(difficulty);
        
        this.generateNewGame();
    }

    getDifficultyName(difficulty) {
        const names = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        };
        return names[difficulty] || '简单';
    }

    checkGame() {
        if (!this.isGameActive) return;
        
        const isValid = this.sudoku.isValid(this.currentGrid);
        const isComplete = this.sudoku.isComplete(this.currentGrid);
        
        if (isComplete) {
            this.showMessage('恭喜！', '你已经成功完成了这个数独游戏！');
        } else if (isValid) {
            this.showMessage('检查通过', '当前填入的数字都是正确的，继续加油！');
        } else {
            this.showMessage('发现错误', '当前填入的数字中有错误，请检查。');
        }
    }

    getHint() {
        if (!this.isGameActive) return;
        
        const hint = this.sudoku.getHint(this.currentGrid);
        
        if (hint) {
            const { row, col, value } = hint;
            
            this.clearSelection();
            
            const cellIndex = row * 9 + col;
            const cellElement = this.sudokuGrid.children[cellIndex];
            
            this.selectedCell = { row, col, element: cellElement };
            cellElement.classList.add('selected');
            
            this.selectedNumber = value;
            
            this.numberBtns.forEach(b => {
                if (b.id !== 'erase-btn' && parseInt(b.dataset.number) === value) {
                    b.classList.add('selected');
                } else if (b.id !== 'erase-btn') {
                    b.classList.remove('selected');
                }
            });
            
            setTimeout(() => {
                this.placeNumber(value);
                this.clearSelection();
                this.selectedNumber = null;
                
                this.numberBtns.forEach(b => {
                    if (b.id !== 'erase-btn') {
                        b.classList.remove('selected');
                    }
                });
            }, 1000);
            
            this.showMessage('提示', `在位置(${row + 1}, ${col + 1})填入数字${value}`);
        } else {
            this.showMessage('无法提示', '游戏已经完成或无法生成提示。');
        }
    }

    resetGame() {
        if (!this.isGameActive) return;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellIndex = row * 9 + col;
                const cellElement = this.sudokuGrid.children[cellIndex];
                
                if (!cellElement.classList.contains('fixed')) {
                    this.currentGrid[row][col] = 0;
                    cellElement.textContent = '';
                    cellElement.classList.remove('user-input', 'error', 'selected');
                }
            }
        }
        
        this.notes = [];
        this.isNoteMode = false;
        this.noteModeBtn.classList.remove('active');
        
        this.mistakes = 0;
        this.updateMistakes();
        this.clearSelection();
        this.selectedNumber = null;
        
        this.numberBtns.forEach(b => {
            if (b.id !== 'erase-btn') {
                b.classList.remove('selected');
            }
        });
        
        this.showMessage('游戏重置', '游戏已重置到初始状态。');
    }

    gameOver() {
        this.isGameActive = false;
        this.stopTimer();
        
        this.showMessage('游戏结束', `你已犯下${this.mistakes}个错误，游戏结束。点击"新游戏"重新开始。`, true);
    }

    gameWon() {
        this.isGameActive = false;
        this.stopTimer();
        
        const time = this.formatTime(this.timer);
        this.showMessage('恭喜获胜！', `你成功完成了数独游戏！用时：${time}`, true);
    }

    updateMistakes() {
        this.mistakesElement.textContent = `${this.mistakes}/${this.maxMistakes}`;
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.formatTime(this.timer);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.timer = 0;
        this.timerElement.textContent = '00:00';
        this.startTimer();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    showMessage(title, text, isGameEnd = false) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.messageModal.style.display = 'flex';
        
        if (isGameEnd) {
            this.messageClose.textContent = '新游戏';
            this.messageClose.onclick = () => {
                this.messageModal.style.display = 'none';
                this.generateNewGame();
            };
        } else {
            this.messageClose.textContent = '确定';
            this.messageClose.onclick = () => {
                this.messageModal.style.display = 'none';
            };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});