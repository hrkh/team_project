/**
 * ========================================
 * 1-PAGE ESCAPE GAME - GAME LOGIC
 * ========================================
 *
 * 謎解きの流れ:
 * 1. ランプを調べる → 「机の引き出しを確認せよ」のメモ
 * 2. 机を調べる → 鍵と「金庫のコードは祖父の誕生日だ」というメモ
 * 3. カレンダーを調べる → 11月17日に赤丸
 * 4. 額縁の写真を調べる → 「1942.11.17 おじいちゃんの誕生日」
 * 5. 金庫に「1117」を入力 → 脱出成功！
 */

class EscapeGame {
  constructor() {
    // Game State
    this.state = {
      started: false,
      escaped: false,
      hintsFound: 0,
      inventory: [],
      discoveredClues: [],
      safeCode: '1117', // 11月17日 = 祖父の誕生日
      startTime: null,
    };

    // Clue definitions - ストーリーの流れに沿った手がかり
    this.clues = {
      lamp: {
        hint: 'ランプの下に黄ばんだ紙切れがある...\n「手がかりは机の引き出しにある」',
        item: null,
        discovered: false,
      },
      desk: {
        hint: '机の引き出しから古い鍵と手紙を見つけた！\n\n手紙には「金庫のコードは祖父の誕生日だ。月と日を4桁で入力せよ」と書かれている。',
        item: '🔑',
        discovered: false,
      },
      calendar: {
        hint: '壁掛けカレンダーを見る。11月のページが開かれていて、\n17日に赤い丸がつけられている...',
        item: null,
        discovered: false,
      },
      painting: {
        hint: '額縁には古い写真が飾られている。\n優しそうな老人が写っている。\n\n裏を見ると...\n「1942.11.17 おじいちゃんの誕生日」と書かれている！',
        item: null,
        discovered: false,
      },
      clock: {
        hint: '古い振り子時計。11時17分で止まっている...\nこの時刻には何か意味があるのだろうか？',
        item: null,
        discovered: false,
      },
      rug: {
        hint: 'カーペットの下を探る...特に何もないようだ。\nでも、ふと額縁の写真が目に入った。',
        item: null,
        discovered: false,
      },
      bookshelf: {
        hint: '本棚を調べる。「11月の思い出」という日記を見つけた。\n中には祖父との思い出が綴られている...',
        item: null,
        discovered: false,
      },
    };

    this.init();
  }

  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.updateUI();
  }

  cacheDOMElements() {
    // Screens
    this.startScreen = document.getElementById('start-screen');
    this.endScreen = document.getElementById('end-screen');

    // Game elements
    this.objects = document.querySelectorAll('.object');
    this.inventorySlots = document.querySelectorAll('.inventory-slot');
    this.hintCounter = document.querySelector('.hint-count');

    // Modals
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalText = document.getElementById('modal-text');
    this.modalEmoji = document.getElementById('modal-emoji');
    this.modalAction = document.getElementById('modal-action');

    // Safe Modal
    this.safeModal = document.getElementById('safe-modal');
    this.codeInputs = document.querySelectorAll('.code-input');

    // Message
    this.message = document.getElementById('message');

    // Buttons
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.closeModalBtns = document.querySelectorAll('.btn-close');
    this.submitCodeBtn = document.getElementById('submit-code');

    // End screen elements
    this.endTime = document.getElementById('end-time');
  }

  bindEvents() {
    // Start game
    this.startBtn?.addEventListener('click', () => this.startGame());

    // Restart game
    this.restartBtn?.addEventListener('click', () => this.restartGame());

    // Object interactions
    this.objects.forEach(obj => {
      obj.addEventListener('click', (e) => this.handleObjectClick(e));
    });

    // Close modals
    this.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Modal backdrop click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    this.safeModal?.addEventListener('click', (e) => {
      if (e.target === this.safeModal) this.closeSafeModal();
    });

    // Code input
    this.codeInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => this.handleCodeInput(e, index));
      input.addEventListener('keydown', (e) => this.handleCodeKeydown(e, index));
    });

    // Submit code
    this.submitCodeBtn?.addEventListener('click', () => this.checkCode());

    // Modal action button
    this.modalAction?.addEventListener('click', () => this.closeModal());
  }

  startGame() {
    this.state.started = true;
    this.state.startTime = Date.now();
    this.startScreen.classList.add('hidden');
    this.showMessage('祖父の書斎に閉じ込められた... 部屋を調べて脱出しよう！', 4000);
  }

  restartGame() {
    // Reset state
    this.state = {
      started: false,
      escaped: false,
      hintsFound: 0,
      inventory: [],
      discoveredClues: [],
      safeCode: '1117',
      startTime: null,
    };

    // Reset clues
    Object.keys(this.clues).forEach(key => {
      this.clues[key].discovered = false;
    });

    // Reset UI
    this.objects.forEach(obj => obj.classList.remove('found'));
    document.querySelector('.door')?.classList.remove('unlocked');

    // Reset inventory
    this.inventorySlots.forEach(slot => {
      slot.classList.remove('filled');
      slot.textContent = '';
    });

    // Reset code inputs
    this.codeInputs.forEach(input => {
      input.value = '';
      input.classList.remove('correct', 'wrong');
    });

    // Hide end screen, show start screen
    this.endScreen.classList.remove('active');
    this.startScreen.classList.remove('hidden');

    this.updateUI();
  }

  handleObjectClick(e) {
    if (!this.state.started || this.state.escaped) return;

    const objectType = e.currentTarget.dataset.type;

    if (objectType === 'safe') {
      this.openSafeModal();
      return;
    }

    if (objectType === 'door') {
      this.tryDoor();
      return;
    }

    this.investigateObject(objectType, e.currentTarget);
  }

  investigateObject(type, element) {
    const clue = this.clues[type];

    if (!clue) {
      this.showMessage('特に何もないようだ...', 2000);
      return;
    }

    if (clue.discovered) {
      // 既に調べた場所でも、もう一度ヒントを表示
      this.showClueModal(clue.hint, clue.item, true);
      return;
    }

    // Mark as discovered
    clue.discovered = true;
    this.state.discoveredClues.push(type);
    this.state.hintsFound++;
    element.classList.add('found');

    // Add item to inventory if exists
    if (clue.item) {
      this.addToInventory(clue.item);
    }

    // Show clue modal
    this.showClueModal(clue.hint, clue.item, false);

    this.updateUI();
  }

  addToInventory(item) {
    const emptySlot = Array.from(this.inventorySlots).find(
      slot => !slot.classList.contains('filled')
    );

    if (emptySlot) {
      emptySlot.textContent = item;
      emptySlot.classList.add('filled');
      this.state.inventory.push(item);
    }
  }

  showClueModal(hint, item, isReview = false) {
    this.modalTitle.textContent = isReview ? '確認' : '発見！';
    this.modalText.textContent = hint;
    this.modalEmoji.textContent = item || '🔍';
    this.modalAction.textContent = 'わかった';
    this.modal.classList.add('active');
  }

  openSafeModal() {
    // Check if player has the key
    if (!this.state.inventory.includes('🔑')) {
      this.showMessage('金庫には鍵が必要だ... 机を調べてみよう', 2500);
      return;
    }

    // ヒント表示
    if (!this.clues.desk.discovered) {
      this.showMessage('まずは手がかりを探そう...', 2000);
      return;
    }

    this.safeModal.classList.add('active');
    this.codeInputs[0]?.focus();
  }

  closeSafeModal() {
    this.safeModal.classList.remove('active');
    this.codeInputs.forEach(input => {
      input.value = '';
      input.classList.remove('correct', 'wrong');
    });
  }

  handleCodeInput(e, index) {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.target.value = '';
      return;
    }

    // Move to next input
    if (value && index < this.codeInputs.length - 1) {
      this.codeInputs[index + 1].focus();
    }
  }

  handleCodeKeydown(e, index) {
    // Handle backspace
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      this.codeInputs[index - 1].focus();
    }

    // Handle enter
    if (e.key === 'Enter') {
      this.checkCode();
    }
  }

  checkCode() {
    const enteredCode = Array.from(this.codeInputs)
      .map(input => input.value)
      .join('');

    if (enteredCode.length !== 4) {
      this.showMessage('4桁のコードを入力してください', 2000);
      return;
    }

    if (enteredCode === this.state.safeCode) {
      // Correct code
      this.codeInputs.forEach(input => input.classList.add('correct'));

      setTimeout(() => {
        this.closeSafeModal();
        this.unlockDoor();
      }, 1000);
    } else {
      // Wrong code
      this.codeInputs.forEach(input => input.classList.add('wrong'));

      // ヒントを出す
      let hintMessage = 'コードが違う...';
      if (!this.clues.painting.discovered && !this.clues.calendar.discovered) {
        hintMessage += ' 部屋をもっと調べてみよう';
      } else if (!this.clues.painting.discovered) {
        hintMessage += ' 額縁の写真を確認してみては？';
      } else if (!this.clues.calendar.discovered) {
        hintMessage += ' カレンダーを確認してみては？';
      }

      this.showMessage(hintMessage, 3000);

      setTimeout(() => {
        this.codeInputs.forEach(input => {
          input.value = '';
          input.classList.remove('wrong');
        });
        this.codeInputs[0]?.focus();
      }, 1000);
    }
  }

  unlockDoor() {
    const door = document.querySelector('.door');
    door?.classList.add('unlocked');

    this.modalTitle.textContent = '金庫が開いた！';
    this.modalText.textContent = '中から脱出用の鍵が出てきた！\n\n祖父の誕生日「11月17日」が暗号だったのか...\nドアを開けて脱出しよう！';
    this.modalEmoji.textContent = '🗝️';
    this.modalAction.textContent = '脱出する！';
    this.modalAction.onclick = () => {
      this.closeModal();
      this.escape();
    };
    this.modal.classList.add('active');
  }

  tryDoor() {
    const door = document.querySelector('.door');

    if (door?.classList.contains('unlocked')) {
      this.escape();
    } else {
      this.showMessage('ドアには鍵がかかっている... 金庫を開ける必要がありそうだ', 3000);
    }
  }

  escape() {
    this.state.escaped = true;

    // Calculate time
    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    this.endTime.textContent = `${minutes}分${seconds}秒`;
    this.endScreen.classList.add('active');
  }

  closeModal() {
    this.modal.classList.remove('active');
    // Reset action button
    this.modalAction.onclick = () => this.closeModal();
  }

  closeAllModals() {
    this.modal.classList.remove('active');
    this.safeModal.classList.remove('active');
  }

  showMessage(text, duration = 2000) {
    this.message.textContent = text;
    this.message.classList.add('show');

    setTimeout(() => {
      this.message.classList.remove('show');
    }, duration);
  }

  updateUI() {
    if (this.hintCounter) {
      this.hintCounter.textContent = `${this.state.hintsFound}/7`;
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.escapeGame = new EscapeGame();
});
