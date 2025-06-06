document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMコンテンツの読み込み完了、初期化処理を開始します。");

    // --- 1. 必要な要素をまとめて取得 & チェック ---
    // A/Bリスト用要素
    const stopDropdown = document.getElementById('stop-dropdown');
    const stopTimeInput = document.getElementById('time-input');
    const addButton = document.getElementById('add-button');
    const AstopList = document.getElementById('A-stop-list');
    const BstopList = document.getElementById('B-stop-list');
    const busDropdown = document.getElementById('bus-dropdown');
    // stop-list用要素
    const saveButton = document.getElementById('save-button'); // ★追加
    const newStopInput = document.getElementById('new-stop');   // ★追加
    const stopList = document.getElementById('stop-list');     // ★追加

    // (要素取得のnullチェックはここで行うのがより安全)
    if (!stopDropdown || !stopTimeInput || !addButton || !AstopList || !BstopList || !busDropdown || !stopList) {
        console.error("初期化に必要なHTML要素が見つかりません。処理を中断します。");
        return;
    }

    // --- 2. ページ読み込み時のデータ復元・初期化 ---
    loadStopListFromLocalStorage(); // 停留所マスタリストを復元
    loadBusListsFromLocalStorage(); // A/Bリストを復元
    generateCalendar();             // カレンダーを生成
    updateDropdownFromStopList();   // プルダウンを初期化 (stop-list復元後に実行)

    // --- 3. イベントリスナーの設定 ---
    addButton.addEventListener('click', function () {
        console.log("追加ボタンがクリックされました。");

        // --- 1. 現在選択されている日付キーを取得 ---
        const currentSelectedDateKey = window.currentSelectedDateKey; // グローバル変数から取得
        if (!currentSelectedDateKey) {
            alert('まずカレンダーから日付を選択してください。');
            console.log("日付が選択されていません。処理を中断します。");
            return; // 日付が選択されていなければ処理を終了
        }
        console.log(`操作対象の日付キー: ${currentSelectedDateKey}`);

        // --- 2. 入力値を取得 ---
        const selectedStopText = stopDropdown.options[stopDropdown.selectedIndex].text;  //停留所名を取得
        const stopTimeValue = stopTimeInput.value; // 停車時刻を取得
        const busSelectedValue = busDropdown.value; // 'バスA' または 'バスB' など

        // --- 3. 入力チェック ---
        if (stopDropdown.value === "") { // 停留所が選択されているか
            alert('停留所を選択してください。');
            return;
        }
        if (stopTimeValue === '') { // 時刻が入力されているか
            alert('時間を入力してください。');
            return;
        }
        if (busSelectedValue === "") { // バスが選択されているか
            alert('バスの種類（AまたはB）を選択してください。');
            return;
        }

        // --- 4. ローカルストレージから現在の日付の既存データを読み込む ---
        //    (データがなければ、空のリストを持つオブジェクトとして初期化)
        let dataForThisDate;
        try {
            const savedDataString = localStorage.getItem(currentSelectedDateKey);
            if (savedDataString) {
                dataForThisDate = JSON.parse(savedDataString);
            } else {
                // この日付のデータがまだなければ、新しい構造で初期化
                dataForThisDate = { aList: [], bList: [] };
            }
        } catch (e) {
            console.error("ローカルストレージからのデータ読み込みまたは解析に失敗しました:", e);
            // エラーが発生した場合も、安全のために新しい構造で初期化
            dataForThisDate = { aList: [], bList: [] };
        }
        console.log("読み込んだ既存データ:", dataForThisDate);


        // --- 5. 新しい項目データオブジェクトを作成 ---
        const newItem = {
            stop: selectedStopText, // 停留所名
            time: stopTimeValue     // 時刻
        };
        console.log("作成された新しい項目:", newItem);

        // --- 6. 選択されたバスに応じて、該当リストに新しい項目を追加 ---
        if (busSelectedValue === 'バスA') {
            if (!dataForThisDate.aList) { // まれにaListプロパティが存在しない場合への対処
                dataForThisDate.aList = [];
            }
            dataForThisDate.aList.push(newItem);
            console.log("Aリストに項目を追加しました。");
            // ▼▼▼ 時刻でソート ▼▼▼
            dataForThisDate.aList.sort((a, b) => a.time.localeCompare(b.time));
            // ▲▲▲ 時刻でソート ▲▲▲
        } else if (busSelectedValue === 'バスB') { // 'バスB' 以外の値も考慮するなら、elseだけで良い
            if (!dataForThisDate.bList) { // まれにbListプロパティが存在しない場合への対処
                dataForThisDate.bList = [];
            }
            dataForThisDate.bList.push(newItem);
            console.log("Bリストに項目を追加しました。");
            // ▼▼▼ 時刻でソート ▼▼▼
            dataForThisDate.bList.sort((a, b) => a.time.localeCompare(b.time));
            // ▲▲▲ 時刻でソート ▲▲▲
        } else {
            // バスAでもバスBでもない場合 (通常は起こらないはずだが念のため)
            console.warn(`未対応のバスタイプ: ${busSelectedValue}`);
            return; // 追加処理を中断
        }
        console.log("ソート後のデータ:", dataForThisDate); // ソート結果の確認
        // --- 7. 更新されたデータ全体をローカルストレージに保存 ---
        //    (saveDataForDate 関数は別途定義されているとします)
        saveDataForDate(currentSelectedDateKey, dataForThisDate);
        console.log("更新されたデータをローカルストレージに保存しました。");

        // --- 8. 画面表示を更新 ---
        //    (displayStopsForDate 関数は別途定義されているとします)
        displayStopsForDate(currentSelectedDateKey);
        console.log("画面表示を更新しました。");

        // --- 9. (任意) 入力欄をクリア ---
        // stopTimeInput.value = '';
        // stopDropdown.selectedIndex = 0; // 最初の選択肢に戻す
        // busDropdown.selectedIndex = 0; // 最初の選択肢に戻す
        console.log("処理完了。");
    });
});

// --- 必要なヘルパー関数 (別途定義) ---
// function saveDataForDate(dateKey, dataToSave) { ... }
// function displayStopsForDate(dateKey) { ... }
// window.currentSelectedDateKey = null; // グローバル変数の初期化 (どこかで行う)

// --- createDeleteButton, save/load関数などはこの外側（グローバルスコープなど）に定義 ---
// function createDeleteButton(...) { ... }
// function saveStopListToLocalStorage(...) { ... }
// function loadStopListFromLocalStorage(...) { ... }
// function saveBusListsToLocalStorage(...) { ... }
// function loadBusListsFromLocalStorage(...) { ... }
// function updateDropdownFromStopList(...) { ... }
// function generateCalendar(...) { ... }
// document.getElementById('save-button').addEventListener('click', function () {新しい停留所を停留所リストに追加する処理（正）

/**削除ボタンを生成（正）
 * リスト項目と親リスト要素を受け取り、削除ボタンを生成して返す関数。
 * クリック時には要素を削除し、リストの種類に応じてローカルストレージ等への保存処理を行う。
 * @param {HTMLLIElement} listItem 削除対象のリスト項目要素 (<li>)
 * @param {HTMLUListElement | HTMLOListElement} listElement 項目が含まれる親のリスト要素 (<ul> または <ol>)
 * @returns {HTMLButtonElement} 生成された削除ボタン要素
 */
function createDeleteButton(listItem, listElement) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.classList.add('delete-button');

    deleteButton.addEventListener('click', function () {
        console.log("削除ボタンがクリックされました。対象リストID:", listElement.id, "対象li:", listItem);

        // --- 1. 現在選択されている日付キーを取得 ---
        const currentSelectedDateKey = window.currentSelectedDateKey;
        if (!currentSelectedDateKey) {
            alert('日付が選択されていません。削除処理を中断します。');
            console.error("削除時: 日付キーが取得できませんでした。");
            return;
        }
        console.log(`削除操作対象の日付キー: ${currentSelectedDateKey}`);

        // --- 2. ローカルストレージから現在の日付の既存データを読み込む ---
        let dataForThisDate;
        try {
            const savedDataString = localStorage.getItem(currentSelectedDateKey);
            if (savedDataString) {
                dataForThisDate = JSON.parse(savedDataString);
                if (!dataForThisDate.aList) dataForThisDate.aList = [];
                if (!dataForThisDate.bList) dataForThisDate.bList = [];
            } else {
                console.warn(`キー '${currentSelectedDateKey}' のデータが見つかりません。`);
                displayStopsForDate(currentSelectedDateKey); // 画面を再描画して整合性を取る
                return;
            }
        } catch (e) {
            console.error("削除時: ローカルストレージからのデータ読み込みまたは解析に失敗しました:", e);
            return;
        }
        console.log("削除前データ:", JSON.parse(JSON.stringify(dataForThisDate)));

        // --- ▼▼▼ ステップ3: 削除対象のインデックスを data-item-index 属性から取得 ▼▼▼ ---
        const itemIndexToDelete = parseInt(listItem.dataset.itemIndex, 10);
        if (isNaN(itemIndexToDelete)) {
            console.error("削除対象のインデックスが listItem の data-item-index から取得できませんでした。listItem:", listItem);
            // displayStopsForDateを呼んで画面を再整合させることも検討
            displayStopsForDate(currentSelectedDateKey);
            return;
        }
        console.log(`削除対象として取得されたインデックス: ${itemIndexToDelete}`);
        // --- ▲▲▲ ステップ3: 削除対象のインデックスを取得 ▲▲▲ ---


        // --- ▼▼▼ ステップ4: 該当リストから指定されたインデックスの項目を削除 (データ操作) ▼▼▼ ---
        let listChanged = false;
        if (listElement.id === 'A-stop-list' && dataForThisDate.aList) {
            // インデックスが有効範囲内かチェック
            if (itemIndexToDelete >= 0 && itemIndexToDelete < dataForThisDate.aList.length) {
                dataForThisDate.aList.splice(itemIndexToDelete, 1); // 指定インデックスから1要素削除
                listChanged = true;
                console.log("Aリストから指定インデックスの項目を削除後:", dataForThisDate.aList);
            } else {
                console.warn(`Aリストのインデックス ${itemIndexToDelete} は範囲外です。リスト長: ${dataForThisDate.aList.length}`);
            }
        } else if (listElement.id === 'B-stop-list' && dataForThisDate.bList) {
            // インデックスが有効範囲内かチェック
            if (itemIndexToDelete >= 0 && itemIndexToDelete < dataForThisDate.bList.length) {
                dataForThisDate.bList.splice(itemIndexToDelete, 1); // 指定インデックスから1要素削除
                listChanged = true;
                console.log("Bリストから指定インデックスの項目を削除後:", dataForThisDate.bList);
            } else {
                console.warn(`Bリストのインデックス ${itemIndexToDelete} は範囲外です。リスト長: ${dataForThisDate.bList.length}`);
            }
        } else if (listElement.id === 'stop-list') { // 既存のstop-listの処理
            console.log('stop-list の削除後処理を実行します。');
            if (listElement.contains(listItem)) {
                listElement.removeChild(listItem);
            }
            if (typeof saveStopListToLocalStorage === 'function') {
                saveStopListToLocalStorage();
            } else { console.warn('saveStopListToLocalStorage 関数が見つかりません。'); }
            if (typeof updateDropdownFromStopList === 'function') {
                updateDropdownFromStopList();
            } else { console.warn('updateDropdownFromStopList 関数が見つかりません。'); }
            return; // stop-listの場合はここで処理終了
        } else {
            console.warn(`未対応のリストIDです: ${listElement.id}`);
            return;
        }
        // --- ▲▲▲ ステップ4: 該当リストから指定されたインデックスの項目を削除 ▲▲▲ ---


        // --- 5. 更新されたデータ全体をローカルストレージに保存 ---
        if (listChanged) {
            saveDataForDate(currentSelectedDateKey, dataForThisDate);
            console.log("更新されたデータをローカルストレージに保存しました。");
        } else {
            console.log("削除対象が見つからないか、インデックスが不正だったため、ローカルストレージは更新されませんでした。");
        }

        // --- 6. 画面表示を更新 (方法A: displayStopsForDate で全再描画) ---
        displayStopsForDate(currentSelectedDateKey);
        console.log("画面表示を更新しました (displayStopsForDate呼び出し)。");

        console.log("削除処理完了。");
    });

    return deleteButton;
}

// 停留所リストをローカルストレージに保存する関数（正）
function saveStopListToLocalStorage() {
    const stopList = document.getElementById('stop-list');
    if (!stopList) { // 要素が見つからない場合のチェック
        console.error("ID 'stop-list' の要素が見つかりません。");
        return; // 処理を中断
    }
    const stops = Array.from(stopList.children).map(li => {
        // li 要素自体や li.querySelector('span') が null になる可能性も考慮すると、さらに丁寧なチェックが可能
        const spanElement = li.querySelector('span');
        return spanElement ? spanElement.textContent.trim() : ''; // 停留所名だけを取得。spanがない場合は空文字など
    }).filter(stopName => stopName !== ''); // 空文字になったものを除外する例

    localStorage.setItem('stopList', JSON.stringify(stops)); // ローカルストレージに保存
    console.log('stopListをローカルストレージに保存しました。', stops); // 保存内容を確認するログ
}

// ページ読み込み時にローカルストレージから停留所リストを復元する関数（正）
function loadStopListFromLocalStorage() {
    const stopList = document.getElementById('stop-list');
    const savedStops = JSON.parse(localStorage.getItem('stopList')) || []; // ローカルストレージからデータを取得

    savedStops.forEach(stopName => {
        const li = document.createElement('li');

        const stopNameElement = document.createElement('span'); // 停留所名を表示する要素
        stopNameElement.textContent = stopName;

        const deleteButton = createDeleteButton(li, stopList); // 削除ボタンを生成

        li.appendChild(stopNameElement);
        li.appendChild(deleteButton);

        stopList.appendChild(li);
    });

    updateDropdownFromStopList(); // プルダウンを更新
}

/**
 * AリストとBリストの現在の内容をローカルストレージに保存する関数
 */
function saveBusListsToLocalStorage() {
    try {
        const aListElement = document.getElementById('A-stop-list');
        const bListElement = document.getElementById('B-stop-list');

        if (!aListElement || !bListElement) {
            console.error("保存対象のAリストまたはBリスト要素が見つかりません。");
            return;
        }

        // 各リストの li 要素内の span からテキスト内容を配列として抽出
        const aListItems = Array.from(aListElement.querySelectorAll('li span')) // spanのテキストを取得
            .map(span => span.textContent);
        const bListItems = Array.from(bListElement.querySelectorAll('li span')) // spanのテキストを取得
            .map(span => span.textContent);

        // ローカルストレージに保存 (キー名は任意)
        localStorage.setItem('aBusListItems', JSON.stringify(aListItems));
        localStorage.setItem('bBusListItems', JSON.stringify(bListItems));

        console.log('AリストとBリストの内容をローカルストレージに保存しました。');

    } catch (error) {
        console.error("A/Bリストのローカルストレージへの保存中にエラー:", error);
    }
}

/**
 * ページ読み込み時にローカルストレージからAリストとBリストの内容を復元する関数
 */
function loadBusListsFromLocalStorage() {
    try {
        const aListElement = document.getElementById('A-stop-list');
        const bListElement = document.getElementById('B-stop-list');

        if (!aListElement || !bListElement) {
            console.error("復元対象のAリストまたはBリスト要素が見つかりません。");
            return;
        }

        // ローカルストレージからデータを取得 (存在しない場合は空配列)
        const savedAListItems = JSON.parse(localStorage.getItem('aBusListItems')) || [];
        const savedBListItems = JSON.parse(localStorage.getItem('bBusListItems')) || [];

        console.log('ローカルストレージからA/Bリストを読み込みます:', { savedAListItems, savedBListItems });

        // Aリストの復元
        // 古い項目が残らないようにリストをクリア(必要に応じて)
        // aListElement.innerHTML = '';
        savedAListItems.forEach(itemText => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = itemText; // 保存されていたテキスト
            li.appendChild(span);

            // ★重要: 削除ボタンも生成して追加する
            const deleteButton = createDeleteButton(li, aListElement); // createDeleteButtonを呼び出す
            li.appendChild(deleteButton);

            aListElement.appendChild(li); // リストに追加
        });

        // Bリストの復元 (Aリストと同様)
        // bListElement.innerHTML = '';
        savedBListItems.forEach(itemText => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = itemText;
            li.appendChild(span);

            const deleteButton = createDeleteButton(li, bListElement); // createDeleteButtonを呼び出す
            li.appendChild(deleteButton);

            bListElement.appendChild(li);
        });

    } catch (error) {
        console.error("A/Bリストのローカルストレージからの読み込み中にエラー:", error);
    }
}

// 停留所リストをプルダウンで表示
function updateDropdownFromStopList() {
    const dropdown = document.getElementById('stop-dropdown');
    const stopList = document.getElementById('stop-list');
    dropdown.innerHTML = ''; // 現在のプルダウン内容をクリア

    Array.from(stopList.children).forEach(li => {
        const stopName = li.querySelector('span')?.textContent || li.textContent.trim();
        const option = document.createElement('option');
        option.value = stopName;
        option.textContent = stopName;
        dropdown.appendChild(option);
    });
}

// 新しい停留所を停留所リストに追加する処理（正）
document.getElementById('save-button').addEventListener('click', function () {
    const newStopInput = document.getElementById('new-stop');
    const stopList = document.getElementById('stop-list');
    const newStopName = newStopInput.value.trim();

    if (newStopName === '') {
        alert('停留所名を入力してください。');
        return;
    }

    const li = document.createElement('li');

    const stopNameElement = document.createElement('span'); // 停留所名を表示する要素
    stopNameElement.textContent = newStopName;

    const deleteButton = createDeleteButton(li, stopList); // 削除ボタンを生成

    li.appendChild(stopNameElement);
    li.appendChild(deleteButton);

    stopList.appendChild(li);

    updateDropdownFromStopList(); // プルダウンを更新
    saveStopListToLocalStorage(); // ローカルストレージに保存
    newStopInput.value = ''; // 入力ボックスをクリア
});

// カレンダーを生成する関数
function generateCalendar() {
    const calendar = document.getElementById('calendar'); // カレンダーの親要素を取得
    if (!calendar) {
        console.error("ID 'calendar' の要素が見つかりません。");
        return;
    }
    calendar.innerHTML = ''; // カレンダーをクリア
    const today = new Date(); // 今日の日付を取得

    for (let i = 0; i < 14; i++) { // 14日分の日付を生成
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        // --- ▼▼▼ 修正点 ▼▼▼ ---
        // ローカルストレージキー用の日付文字列 (YYYY-MM-DD形式) を生成
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 0埋め　
        // .toString(): 計算結果の数値（例: 5 や 11）を文字列に変換します。例えば、数値の 5 が文字列の "5" になります。これは次の padStart を使うために必要です。
        //.padStart(2, '0'): これが**「0埋め」**の処理です。 padStart() は文字列メソッドで、現在の文字列が指定した長さ (2) に満たない場合に、先頭に指定した文字 ('0') を追加して、指定した長さになるようにします。
        // 2: 目標とする文字列の長さです。月は必ず2桁（例: 01, 05, 10, 12）で表現したいので 2 を指定します。'0': 長さが足りない場合に先頭に追加する文字です。ここでは 0 を指定しています。
        // 結果:もし月が 5（5月）なら、.toString() で "5" になり、.padStart(2, '0') で "05" になります。
        const dayOfMonth = currentDate.getDate().toString().padStart(2, '0'); // 0埋め
        const dateKey = `${year}-${month}-${dayOfMonth}`; // 例: "2023-11-15"

        // 表示用の日付文字列
        const dayOfWeek = currentDate.toLocaleDateString('ja-JP', { weekday: 'short' }); // 曜日
        const formattedDisplayDate = `${currentDate.getMonth() + 1}/${dayOfMonth} (${dayOfWeek})`; // 例: "11/15 (水)"
        // --- ▲▲▲ 修正点 ▲▲▲ ---

        const li = document.createElement('li'); // 日付を表示する<li>要素を作成
        li.textContent = formattedDisplayDate; // 表示用テキストを設定

        // --- ▼▼▼ 修正点 ▼▼▼ ---
        // li要素にdata-*属性を使って、キーとなる日付情報を埋め込む
        li.dataset.dateKey = dateKey; // data-date-key="2023-11-15" という属性が付く
        // --- ▲▲▲ 修正点 ▲▲▲ ---

        li.addEventListener('click', function () {
            // 他の日付の選択状態を解除
            const allDates = calendar.querySelectorAll('li');
            allDates.forEach(dateEl => dateEl.classList.remove('selected'));
            // クリックされた日付を選択状態にする
            this.classList.add('selected');

            const selectedDateKey = this.dataset.dateKey; // YYYY-MM-DD
            const displayDateText = this.textContent;   // ★★★ この行を追加またはコメントアウト解除 ★★★

            console.log("選択された日付キー:", selectedDateKey, "表示用テキスト:", displayDateText);
            window.currentSelectedDateKey = selectedDateKey;

            // h2 タイトルの更新
            const selectDayH2 = document.getElementById('select-day');
            if (selectDayH2) {
                selectDayH2.textContent = `${displayDateText} の停留所`;
            }

            displayStopsForDate(selectedDateKey);
        });

        calendar.appendChild(li); // カレンダーに日付を追加

        // --- ▼▼▼ 追加推奨 ▼▼▼ ---
        // 最初の日にデフォルトでselectedクラスを付けておく
        if (i === 0) {
            li.classList.add('selected');
            // ページ読み込み時に最初の日のデータを表示 & グローバル変数にセット
            displayStopsForDate(dateKey);
            // ▼▼▼ 初期表示時の h2 タイトルの更新 ▼▼▼
            const selectDayH2 = document.getElementById('select-day');
            if (selectDayH2) {
                selectDayH2.textContent = `${formattedDisplayDate} の停留所`; // formattedDisplayDate は表示用日付
            }
            // ▲▲▲ 初期表示時の h2 タイトルの更新 ▲▲▲
            window.currentSelectedDateKey = dateKey; // 初期値を設定
        }
        // --- ▲▲▲ 追加推奨 ▲▲▲ ---
    }
}

// --- 選択中の日付を保持する方法について ---
// グローバル変数 (window.currentSelectedDateKey) は手軽ですが、
// 大規模になると管理が大変になる可能性があります。
// 代替案としては：
// 1. モジュールスコープ変数: コード全体を即時関数やモジュールで囲み、
//    そのスコープ内の変数として selectedDateKey を保持する。
//    let currentSelectedDateKey = null; // モジュールのトップレベルで宣言
//    (これが一般的に推奨される方法)
// 2. データ属性を親要素に持たせる: カレンダー要素自体に data-selected-date 属性を
//    持たせ、必要な時にそこから読み取る。

// グローバル変数を使う場合の初期化 (念のため)
window.currentSelectedDateKey = null;

// --- displayStopsForDate 関数の呼び出し元として ---
// document.addEventListener('DOMContentLoaded', function () {
//     generateCalendar(); // カレンダー生成（内部で最初の日のdisplayStopsForDateも呼ばれる）
//     // loadStopListFromLocalStorage(); // これは別
//     // loadBusListsFromLocalStorage(); // これは別 (日付ごとなので不要になる可能性)
//     // updateDropdownFromStopList(); // これは別
//     // ... 他の初期化 ...
// });

/**
 * 指定された日付キーに対応する停留所リストを表示する
 * @param {string} dateKey 'YYYY-MM-DD' 形式の日付キー
 */
function displayStopsForDate(dateKey) {
    console.log(`表示を更新中: ${dateKey}`);
    const aListElement = document.getElementById('A-stop-list');
    const bListElement = document.getElementById('B-stop-list');

    if (!aListElement || !bListElement) {
        console.error("AリストまたはBリスト要素が見つかりません。");
        return;
    }

    // リストをクリア
    aListElement.innerHTML = '';
    bListElement.innerHTML = '';

    // ローカルストレージからデータを取得 (キーは dateKey を使う)
    const savedData = JSON.parse(localStorage.getItem(dateKey)) || { aList: [], bList: [] };
    const stopsA = savedData.aList;
    const stopsB = savedData.bList;

    console.log('表示するデータ:', { stopsA, stopsB });

    // Aリストの復元
    // ▼▼▼ forEach に第2引数 index を追加 ▼▼▼
    stopsA.forEach(({ stop, time }, index) => { // itemオブジェクトと、その配列内でのindexを取得
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${time} ${stop}`;
        li.appendChild(span);

        // ▼▼▼ data-item-index 属性を追加 ▼▼▼
        li.dataset.itemIndex = index; // 配列のインデックスをdata属性として設定
        // ▲▲▲ data-item-index 属性を追加 ▲▲▲

        const deleteButton = createDeleteButton(li, aListElement);
        li.appendChild(deleteButton);
        aListElement.appendChild(li);
    });

    // Bリストの復元 (同様)
    // ▼▼▼ forEach に第2引数 index を追加 ▼▼▼
    stopsB.forEach(({ stop, time }, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${time} ${stop}`;
        li.appendChild(span);

        // ▼▼▼ data-item-index 属性を追加 ▼▼▼
        li.dataset.itemIndex = index; // 配列のインデックスをdata属性として設定
        // ▲▲▲ data-item-index 属性を追加 ▲▲▲

        const deleteButton = createDeleteButton(li, bListElement);
        li.appendChild(deleteButton);
        bListElement.appendChild(li);
    });
}

function saveDataForDate(dateKey, dataToSave) {
    if (!dateKey) { // dateKeyがnullやundefinedの場合は保存しない
        console.error("保存するための日付キーが指定されていません。");
        return;
    }
    try {
        localStorage.setItem(dateKey, JSON.stringify(dataToSave));
        console.log(`データがキー '${dateKey}' でローカルストレージに保存されました。`);
    } catch (error) {
        console.error(`キー '${dateKey}' でのローカルストレージ保存中にエラー:`, error);
    }
}

