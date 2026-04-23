import { createEmptyBoard, cloneBoard, isValid, fillBoard, removeNumbers } from './sudokuEngine.js';
import { solveAI } from './sudokuAI.js';

document.addEventListener('DOMContentLoaded', () => {
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
        setTimeout(() => {
            appLoader.classList.add('hide');
        }, 180);
    }

    const gridEl = document.getElementById('sudoku-grid');
    const newGameBtn = document.getElementById('new-game-btn');
    const solveBtn = document.getElementById('solve-btn');
    const clearBtn = document.getElementById('clear-btn');
    const diffBtns = document.querySelectorAll('.diff-btn');
    const numBtns = document.querySelectorAll('.num-btn');
    const diffSlider = document.querySelector('.pill-slider');
    
    // Shared state object for UI and AI
    const state = {
        cells: [],
        board: [],
        initialBoard: [],
        solution: [],
        backtrackCounters: Array.from({ length: 9 }, () => Array(9).fill(0)),
        isSolving: false,
        abortSolve: false,
        selectedIndex: null,
        triggerNumBtnPress: triggerNumBtnPress,
        renderBoard: null // Assigned below
    };
    
    let currentDifficulty = 'easy';

    function moveDifficultySlider(activeBtn) {
        if (!diffSlider || !activeBtn) return;
        const allBtns = Array.from(diffBtns);
        const activeIndex = allBtns.indexOf(activeBtn);
        if (activeIndex < 0) return;
        diffSlider.style.transform = `translateX(${activeIndex * 100}%)`;
    }

    function pulseCellValue(cell) {
        if (!cell) return;
        cell.classList.remove('value-updated');
        requestAnimationFrame(() => {
            cell.classList.add('value-updated');
        });
    }

    function triggerButtonFeedback(btn) {
        if (!btn) return;
        btn.classList.remove('button-clicked');
        requestAnimationFrame(() => {
            btn.classList.add('button-clicked');
        });
        setTimeout(() => btn.classList.remove('button-clicked'), 240);
    }

    function generateGame() {
        state.solution = createEmptyBoard();
        fillBoard(state.solution);
        state.initialBoard = cloneBoard(state.solution);
        removeNumbers(state.initialBoard, currentDifficulty);
        state.board = cloneBoard(state.initialBoard);
        state.backtrackCounters = Array.from({ length: 9 }, () => Array(9).fill(0));
        renderBoard();
        state.isSolving = false;
        state.selectedIndex = null;
    }

    // --- UI Logic ---
    function initGridUI() {
        gridEl.innerHTML = '';
        state.cells = [];
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.tabIndex = 0;
            
            cell.addEventListener('click', () => {
                if (!state.isSolving) selectCell(i);
            });
            
            cell.addEventListener('keydown', handleKeydown);
            
            gridEl.appendChild(cell);
            state.cells.push(cell);
        }
    }

    function renderBoard() {
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const val = state.board[row][col];
            const initVal = state.initialBoard[row][col];
            
            const cell = state.cells[i];
            cell.className = 'cell'; // reset classes
            cell.style.removeProperty('--heat-intensity');
            cell.style.backgroundColor = '';
            cell.style.color = '';
            
            if (state.selectedIndex === i) cell.classList.add('selected');
            
            if (val !== 0) {
                cell.textContent = val;
                if (initVal !== 0) {
                    cell.classList.add('given');
                } else if (!cell.classList.contains('ai-fill')) {
                    cell.classList.add('user-input');
                }
            } else {
                cell.textContent = '';
            }
        }
    }
    state.renderBoard = renderBoard;

    function selectCell(index) {
        if (state.selectedIndex !== null) {
            state.cells[state.selectedIndex].classList.remove('selected');
        }
        state.selectedIndex = index;
        state.cells[state.selectedIndex].classList.add('selected');
        state.cells[state.selectedIndex].focus();
    }

    function handleInput(val) {
        if (state.selectedIndex === null || state.isSolving) return;
        const row = Math.floor(state.selectedIndex / 9);
        const col = state.selectedIndex % 9;
        
        // Cannot edit given cells
        if (state.initialBoard[row][col] !== 0) return;

        if (val === 0) {
            state.board[row][col] = 0;
            state.cells[state.selectedIndex].textContent = '';
            state.cells[state.selectedIndex].classList.remove('error', 'user-input');
            return;
        }

        // Temporarily clear current pos for validation
        const oldVal = state.board[row][col];
        state.board[row][col] = 0;
        const valid = isValid(state.board, row, col, val);
        state.board[row][col] = val;
        
        state.cells[state.selectedIndex].textContent = val;
        state.cells[state.selectedIndex].classList.add('user-input');
        pulseCellValue(state.cells[state.selectedIndex]);
        
        if (!valid) {
            state.cells[state.selectedIndex].classList.add('error');
            setTimeout(() => {
                if(state.cells[state.selectedIndex]) state.cells[state.selectedIndex].classList.remove('error');
            }, 800);
        } else {
            state.cells[state.selectedIndex].classList.remove('error');
            checkWin();
        }
    }
    
    function checkWin() {
        let isComplete = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (state.board[i][j] === 0) isComplete = false;
            }
        }
        
        if (isComplete) {
            let won = true;
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    const temp = state.board[i][j];
                    state.board[i][j] = 0;
                    if (!isValid(state.board, i, j, temp)) {
                        won = false;
                    }
                    state.board[i][j] = temp;
                }
            }
            if (won) {
                setTimeout(() => alert('Congratulations! You solved the Sudoku!'), 100);
            }
        }
    }

    function handleKeydown(e) {
        if (state.isSolving) return;
        if (e.key >= '1' && e.key <= '9') {
            handleInput(parseInt(e.key));
            triggerNumBtnPress(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            handleInput(0);
            triggerNumBtnPress('0');
        } else if (e.key === 'ArrowUp') {
            if (state.selectedIndex >= 9) selectCell(state.selectedIndex - 9);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (state.selectedIndex < 72) selectCell(state.selectedIndex + 9);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            if (state.selectedIndex % 9 > 0) selectCell(state.selectedIndex - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            if (state.selectedIndex % 9 < 8) selectCell(state.selectedIndex + 1);
            e.preventDefault();
        }
    }

    function triggerNumBtnPress(val) {
        const btn = document.querySelector(`.num-btn[data-val="${val}"]`);
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 50);
        }
    }

    async function interruptSolver() {
        if (state.isSolving) {
            state.abortSolve = true;
            while (state.isSolving) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            state.abortSolve = false;
        }
    }

    // --- Event Listeners ---
    newGameBtn.addEventListener('click', async () => {
        triggerButtonFeedback(newGameBtn);
        await interruptSolver();
        generateGame();
    });
    
    clearBtn.addEventListener('click', async () => {
        triggerButtonFeedback(clearBtn);
        await interruptSolver();
        state.board = cloneBoard(state.initialBoard);
        renderBoard();
    });

    solveBtn.addEventListener('click', async () => {
        if (state.isSolving) return;
        triggerButtonFeedback(solveBtn);
        state.abortSolve = false;
        state.isSolving = true;
        await solveAI(state);
        state.isSolving = false;
    });

    diffBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await interruptSolver();
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            moveDifficultySlider(e.target);
            currentDifficulty = e.target.dataset.diff;
            generateGame();
        });
    });

    numBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerButtonFeedback(btn);
            handleInput(parseInt(e.target.dataset.val));
        });
    });

    // --- Init ---
    initGridUI();
    moveDifficultySlider(document.querySelector('.diff-btn.active'));
    generateGame();
});
