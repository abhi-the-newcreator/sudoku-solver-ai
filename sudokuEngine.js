export function createEmptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneBoard(source) {
    return source.map(row => [...row]);
}

export function isValid(testBoard, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (testBoard[row][x] === num) return false;
    }
    // Check col
    for (let x = 0; x < 9; x++) {
        if (testBoard[x][col] === num) return false;
    }
    // Check 3x3 box
    let startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (testBoard[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
}

export function fillBoard(tempBoard) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (tempBoard[i][j] === 0) {
                // Shuffle numbers 1-9 for randomness
                let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                numbers.sort(() => Math.random() - 0.5);
                
                for (let num of numbers) {
                    if (isValid(tempBoard, i, j, num)) {
                        tempBoard[i][j] = num;
                        if (fillBoard(tempBoard)) return true;
                        tempBoard[i][j] = 0; // backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
}

export function removeNumbers(tempBoard, difficulty) {
    let attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
    while (attempts > 0) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        while (tempBoard[row][col] === 0) {
            row = Math.floor(Math.random() * 9);
            col = Math.floor(Math.random() * 9);
        }
        tempBoard[row][col] = 0;
        attempts--;
    }
}
