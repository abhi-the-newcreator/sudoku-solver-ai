import { isValid } from './sudokuEngine.js';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Visual Backtracking Algorithm
async function solveAIVisual(state) {
    if (state.abortSolve) return false;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (state.board[i][j] === 0) {
                const cellIndex = i * 9 + j;
                state.cells[cellIndex].classList.add('ai-solving');
                
                for (let num = 1; num <= 9; num++) {
                    if (state.abortSolve) return false;
                    if (isValid(state.board, i, j, num)) {
                        state.board[i][j] = num;
                        state.cells[cellIndex].textContent = num;
                        state.cells[cellIndex].className = 'cell ai-fill';
                        state.cells[cellIndex].classList.add('value-updated');
                        state.triggerNumBtnPress(num);
                        
                        await sleep(15); 
                        if (state.abortSolve) return false;
                        
                        if (await solveAIVisual(state)) {
                            state.cells[cellIndex].classList.remove('ai-solving');
                            return true;
                        }
                        if (state.abortSolve) return false;
                        
                        // Backtrack
                        state.board[i][j] = 0;
                        state.backtrackCounters[i][j]++;
                        
                        state.cells[cellIndex].textContent = '';
                        state.cells[cellIndex].className = 'cell ai-solving error';
                        state.cells[cellIndex].style.removeProperty('--heat-intensity');
                        state.cells[cellIndex].style.backgroundColor = '';
                        
                        await sleep(5);
                        if (state.abortSolve) return false;
                    }
                }
                
                // Total failure for this cell on this branch
                state.cells[cellIndex].className = 'cell';
                state.cells[cellIndex].style.backgroundColor = '';
                state.cells[cellIndex].style.color = '';
                return false;
            }
        }
    }
    return true; // Solved
}

export async function solveAI(state) {
    // Clear backtracks
    state.backtrackCounters = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    // Deselect active cell
    if (state.selectedIndex !== null) {
        state.cells[state.selectedIndex].classList.remove('selected');
        state.selectedIndex = null;
    }

    // Keep user valid inputs, clear wrong ones
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (state.initialBoard[i][j] === 0) {
                // Check if current board state is correct vs answer key
                if (state.board[i][j] !== 0 && state.board[i][j] !== state.solution[i][j]) {
                    state.board[i][j] = 0; // Clear wrong user move
                }
                state.cells[i * 9 + j].style.backgroundColor = '';
                state.cells[i * 9 + j].style.color = '';
                state.cells[i * 9 + j].style.removeProperty('--heat-intensity');
                state.cells[i * 9 + j].classList.remove('ai-heat-green', 'ai-heat-red', 'value-updated');
            }
        }
    }
    state.renderBoard();

    const result = await solveAIVisual(state);
    
    // Apply heatmap colors now that it's complete
    if (!state.abortSolve && result) {
        for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            // If it was animated by AI, apply background heatmap
            if (state.initialBoard[i][j] === 0 && state.board[i][j] !== 0) {
                const c = state.cells[i * 9 + j];
                c.classList.remove('ai-heat-green', 'ai-heat-red');
                if (state.backtrackCounters[i][j] === 0) {
                    c.classList.add('ai-heat-green');
                    c.style.removeProperty('--heat-intensity');
                } else {
                    const intensity = Math.min(1.0, 0.2 + (state.backtrackCounters[i][j] * 0.08));
                    c.classList.add('ai-heat-red');
                    c.style.setProperty('--heat-intensity', intensity.toString());
                }
            }
        }
        }
    }
    
    return result;
}
