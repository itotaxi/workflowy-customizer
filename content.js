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
  });
}