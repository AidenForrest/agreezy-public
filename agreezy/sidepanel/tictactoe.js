/**
 * Tic-Tac-Toe Game
 * Simple game to play while waiting for AI processing
 */

class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X'; // Player is X, AI is O
    this.gameOver = false;
    this.boardElement = null;
    this.statusElement = null;
  }

  init(boardId, statusId) {
    this.boardElement = document.getElementById(boardId);
    this.statusElement = document.getElementById(statusId);
    this.render();
  }

  render() {
    if (!this.boardElement) return;

    this.boardElement.innerHTML = '';

    this.board.forEach((cell, index) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell';
      if (cell) {
        cellDiv.textContent = cell;
        cellDiv.classList.add('taken', cell.toLowerCase());
      }
      cellDiv.addEventListener('click', () => this.handleCellClick(index));
      this.boardElement.appendChild(cellDiv);
    });

    this.updateStatus();
  }

  handleCellClick(index) {
    // Ignore if game over or cell taken or AI's turn
    if (this.gameOver || this.board[index] || this.currentPlayer === 'O') {
      return;
    }

    // Player makes move
    this.makeMove(index, 'X');

    // Check if game over
    if (this.checkGameOver()) return;

    // AI makes move after short delay
    setTimeout(() => {
      if (!this.gameOver) {
        this.makeAIMove();
        this.checkGameOver();
      }
    }, 300);
  }

  makeMove(index, player) {
    this.board[index] = player;
    this.currentPlayer = player === 'X' ? 'O' : 'X';
    this.render();
  }

  makeAIMove() {
    const move = this.getBestMove();
    if (move !== null) {
      this.makeMove(move, 'O');
    }
  }

  getBestMove() {
    // 1. Try to win
    const winMove = this.findWinningMove('O');
    if (winMove !== null) return winMove;

    // 2. Block player from winning
    const blockMove = this.findWinningMove('X');
    if (blockMove !== null) return blockMove;

    // 3. Take center if available
    if (this.board[4] === null) return 4;

    // 4. Take a corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => this.board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Take any available cell
    const available = this.board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
    return available.length > 0 ? available[0] : null;
  }

  findWinningMove(player) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]  // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      const values = [this.board[a], this.board[b], this.board[c]];

      // Check if two cells have the player and one is empty
      if (values.filter(v => v === player).length === 2 && values.includes(null)) {
        return pattern[values.indexOf(null)];
      }
    }

    return null;
  }

  checkGameOver() {
    const winner = this.checkWinner();

    if (winner) {
      this.gameOver = true;
      this.highlightWinner(winner.pattern);
      this.updateStatus(winner.player);
      return true;
    }

    // Check for draw
    if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.updateStatus('draw');
      return true;
    }

    return false;
  }

  checkWinner() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]  // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return { player: this.board[a], pattern };
      }
    }

    return null;
  }

  highlightWinner(pattern) {
    const cells = this.boardElement.querySelectorAll('.cell');
    pattern.forEach(index => {
      cells[index].classList.add('winner');
    });
  }

  updateStatus(result) {
    if (!this.statusElement) return;

    if (result === 'X') {
      this.statusElement.textContent = 'You win!';
      this.statusElement.className = 'game-status win';
    } else if (result === 'O') {
      this.statusElement.textContent = 'AI wins!';
      this.statusElement.className = 'game-status lose';
    } else if (result === 'draw') {
      this.statusElement.textContent = "It's a draw!";
      this.statusElement.className = 'game-status';
    } else if (this.currentPlayer === 'X') {
      this.statusElement.textContent = 'Your turn!';
      this.statusElement.className = 'game-status';
    } else {
      this.statusElement.textContent = 'AI is thinking...';
      this.statusElement.className = 'game-status';
    }
  }

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.render();
  }
}

// Export for use in index.js
export default TicTacToe;
