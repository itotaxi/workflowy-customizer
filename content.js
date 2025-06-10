// 追加の動的処理が必要な場合に使うファイル（今回は空でもOK）
console.log("Workflowy Customizer is running.");

// Workflowyが完全に読み込まれるまで待つ
window.addEventListener('load', function() {
  // Cmd+; キーバインドの処理を設定
  setupCommandSemicolonHandler();
  
  // リサイズハンドル機能をセットアップ
  setupResizeHandles();
  
  // スミカッコ【】の背景色機能をセットアップ
  setupBracketHighlighting();
  
  // 日付ハイライト機能をセットアップ
  setupDateHighlighting();
});

// Cmd+; キーバインド処理の設定
function setupCommandSemicolonHandler() {
  // 1. document全体でのキャプチャフェーズでイベントを捕捉（最も早い段階）
  document.addEventListener('keydown', handleCommandSemicolon, true);
  
  // 2. Workflowyのアプリケーションコンテナを特定して、そこでもイベントをバインド
  const appContainers = [
    document.querySelector('#app'),
    document.querySelector('.page'),
    document.querySelector('.content'),
    document.body
  ].filter(el => el); // nullやundefinedを除外
  
  // 見つかったすべてのコンテナにイベントリスナーを追加
  appContainers.forEach(container => {
    container.addEventListener('keydown', handleCommandSemicolon, true);
  });
  
  // 3. 動的に追加される可能性のあるDOM要素のための対策
  // MutationObserverを使用して新しく追加されるDOM要素を監視
  const observer = new MutationObserver(function(mutations) {
    const newAppContainer = document.querySelector('#app') || document.querySelector('.page');
    if (newAppContainer && !newAppContainer.hasCommandSemicolonHandler) {
      newAppContainer.addEventListener('keydown', handleCommandSemicolon, true);
      newAppContainer.hasCommandSemicolonHandler = true;
    }
  });
  
  // body全体の変更を監視
  observer.observe(document.body, { 
    childList: true,
    subtree: true 
  });
}

// Cmd+; キーボードショートカットのハンドラー関数
function handleCommandSemicolon(event) {
  // Macの場合はmetaKey（Commandキー）、Windowsの場合はctrlKey
  if ((event.key === ';' || event.key === ':') && (event.metaKey || event.ctrlKey)) {
    // WorkflowyのキーハンドラーへのイベントバブリングをすべてブロックL
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // デフォルトのブラウザ動作を許可
    // ブラウザの文字拡大機能を動作させるため
    return true;
  }
}

// リサイズハンドルの設定
function setupResizeHandles() {
  // 初期化時にリサイズハンドルを追加
  addResizeHandlesToElements();
  
  // DOM変更を監視して動的に追加される要素にもリサイズハンドルを追加
  const observer = new MutationObserver(function(mutations) {
    addResizeHandlesToElements();
  });
  
  // body全体の変更を監視
  observer.observe(document.body, { 
    childList: true,
    subtree: true 
  });
  
  // 通常のスクロールやマウス操作では更新が遅れる場合があるので、
  // 定期的にリサイズハンドルの存在を確認
  setInterval(addResizeHandlesToElements, 2000);
}

// 対象要素にリサイズハンドルを追加
function addResizeHandlesToElements() {
  // 対象クラス名を持つ要素を取得
  const targetElements = document.querySelectorAll('._1bivj9v');
  
  targetElements.forEach(element => {
    // 既にリサイズハンドルが追加されていない場合のみ追加
    if (!element.querySelector('.wf-resize-handle')) {
      // 現在の幅を取得（初期値を保存）
      const currentWidth = getComputedStyle(element).minWidth;
      element.setAttribute('data-original-width', currentWidth);
      
      // リサイズハンドル要素を作成
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'wf-resize-handle';
      resizeHandle.title = 'ドラッグして幅を調整';
      
      // リサイズハンドルを要素に追加
      element.appendChild(resizeHandle);
      
      // ドラッグ操作のイベントを設定
      setupDragEvents(element, resizeHandle);
    }
  });
}

// ドラッグ操作のイベント設定
function setupDragEvents(element, handle) {
  let startX, startWidth;
  
  // マウスダウン時の処理
  handle.addEventListener('mousedown', function(e) {
    // ドラッグ開始時の情報を記録
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(element).minWidth);
    
    // リサイズハンドルをアクティブ状態に
    handle.classList.add('active');
    document.body.classList.add('wf-resizing');
    
    // マウス移動とマウスアップのイベントをdocumentに設定
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // イベントの伝播を停止
    e.preventDefault();
    e.stopPropagation();
  });
  
  // マウス移動時の処理
  function onMouseMove(e) {
    if (startX) {
      // 移動距離から新しい幅を計算
      const moveX = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + moveX); // 最小幅を100pxに制限
      
      // 要素のmin-widthプロパティを更新
      element.style.minWidth = newWidth + 'px';
      
      // 現在の幅をローカルストレージに保存
      localStorage.setItem('wf-custom-width', newWidth);
    }
  }
  
  // マウスアップ時の処理
  function onMouseUp(e) {
    // イベントリスナーを削除
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // アクティブ状態を解除
    handle.classList.remove('active');
    document.body.classList.remove('wf-resizing');
    
    startX = null;
  }
}

// 保存された幅を適用する関数
function applyStoredWidth() {
  const storedWidth = localStorage.getItem('wf-custom-width');
  if (storedWidth) {
    const targetElements = document.querySelectorAll('._1bivj9v');
    targetElements.forEach(element => {
      element.style.minWidth = storedWidth + 'px';
    });
  }
}

// 保存された幅を適用
window.addEventListener('DOMContentLoaded', applyStoredWidth);
// 遅延読み込みにも対応
setTimeout(applyStoredWidth, 1000);

// スミカッコ【】の背景色機能の設定
function setupBracketHighlighting() {
  // 初期化時に処理
  highlightBrackets();
  
  // DOM変更を監視
  const observer = new MutationObserver(function(mutations) {
    highlightBrackets();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// スミカッコ【】を含むcontentに背景色を追加
function highlightBrackets() {
  const contentElements = document.querySelectorAll('.content');
  
  contentElements.forEach(element => {
    const text = element.textContent || '';
    
    if (text.includes('【') && text.includes('】')) {
      element.classList.add('has-brackets');
    } else {
      element.classList.remove('has-brackets');
    }
    
    // 「x 」から始まるコンテンツの処理
    if (text.startsWith('x ')) {
      element.classList.add('has-x-mark');
      
      // 「x 」を❌に置き換える
      const childNodes = Array.from(element.childNodes);
      childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.startsWith('x ')) {
          node.textContent = '❌ ' + node.textContent.substring(2);
        }
      });
    } else {
      element.classList.remove('has-x-mark');
    }
    
    // 優先順位タグのクラスを追加
    addPriorityClasses(element);
  });
}

// 優先順位タグのクラスを追加（DOM操作なし）
function addPriorityClasses(element) {
  const text = element.textContent || '';
  
  // 既存のクラスを削除
  for (let i = 1; i <= 5; i++) {
    element.classList.remove(`has-priority-p${i}`);
  }
  
  // doneクラスがある親要素を確認
  const parentProject = element.closest('.project');
  if (parentProject && parentProject.classList.contains('done')) {
    return; // doneの場合は優先順位クラスを追加しない
  }
  
  // #p1〜#p5のパターンをチェック
  for (let i = 1; i <= 5; i++) {
    if (text.includes(`#p${i}`)) {
      element.classList.add(`has-priority-p${i}`);
      break; // 最初に見つかった優先度のみ適用
    }
  }
}

// 日付ハイライト機能の設定
function setupDateHighlighting() {
  // 初期化時に処理
  highlightDates();
  
  // DOM変更を監視
  const observer = new MutationObserver(function(mutations) {
    highlightDates();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  // 定期的にチェック（日付が変わった時のため）
  setInterval(highlightDates, 60000); // 1分ごと
}

// 日付をハイライトする関数
function highlightDates() {
  const timeElements = document.querySelectorAll('time.monolith-pill');
  
  timeElements.forEach(timeElement => {
    // 既に処理済みかチェック
    if (timeElement.dataset.dateProcessed === 'true') return;
    
    // 親の.content要素を確認
    const parentContent = timeElement.closest('.content');
    if (!parentContent) return;
    
    // .content内のテキストノードと要素をチェック
    const contentText = parentContent.textContent.trim();
    const timeText = timeElement.textContent.trim();
    
    // timeElementのテキストがcontentのテキスト全体と一致する場合（日付単体）はスキップ
    if (contentText === timeText) {
      timeElement.dataset.dateProcessed = 'true'; // 処理済みフラグは設定
      return;
    }
    
    // 日付情報を取得
    const startYear = parseInt(timeElement.getAttribute('startyear'));
    const startMonth = parseInt(timeElement.getAttribute('startmonth'));
    const startDay = parseInt(timeElement.getAttribute('startday'));
    
    if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay)) return;
    
    // 日付オブジェクトを作成（月は0ベースなので-1）
    const targetDate = new Date(startYear, startMonth - 1, startDay);
    targetDate.setHours(0, 0, 0, 0); // 時間をリセット
    
    // 今日の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時間をリセット
    
    // 日数差を計算
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 処理済みフラグを設定
    timeElement.dataset.dateProcessed = 'true';
    
    // 日数に応じてクラスを追加
    if (diffDays < 0) {
      timeElement.classList.add('date-overdue');
      // 超過した場合は日数表示なし
    } else if (diffDays === 0) {
      timeElement.classList.add('date-today');
      timeElement.dataset.daysText = 'D0';
    } else if (diffDays <= 5) {
      timeElement.classList.add('date-soon');
      timeElement.dataset.daysText = `D${diffDays}`;
    }
  });
}