'use strict';
const form = document.getElementById('photo-form');
const fileInput = document.getElementById('photo');
const tokenInput = document.getElementById('github-token');
const publish = document.getElementById('publish');
const status = document.getElementById('status');
const preview = document.querySelector('.hero-photo');
const download = document.getElementById('download-photo');
const endpoint = 'https://api.github.com/repos/bbfry656/Namiya/contents/assets/hero-portrait.jpg';
let prepared = null;
let selection = 0;
let busy = false;

function message(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}

fileInput.addEventListener('change', async () => {
  const current = ++selection;
  prepared = null;
  download.removeAttribute('href');
  download.setAttribute('aria-disabled', 'true');
  publish.disabled = true;
  preview.style.removeProperty('background-image');
  const file = fileInput.files[0];
  if (!file) return message('Выберите фотографию для предпросмотра.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    return message('Выберите JPG, PNG или WebP размером до 20 МБ.', true);
  }
  message('Подготавливаем фотографию…');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
    const ratio = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    context.fillStyle = '#16324b';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.88);
    if (current !== selection) return;
    prepared = data.split(',')[1];
    download.href = data;
    download.download = 'hero-portrait.jpg';
    download.setAttribute('aria-disabled', 'false');
    preview.style.backgroundImage = `url("${data}")`;
    publish.disabled = false;
    message('Предпросмотр готов. Если всё нравится, опубликуйте фотографию.');
  } catch {
    if (current === selection) message('Не удалось прочитать снимок. Попробуйте другой файл.', true);
  } finally {
    bitmap?.close();
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !prepared) return;
  const token = tokenInput.value.trim();
  if (!token) return message('Для публикации нужен токен доступа GitHub.', true);
  busy = true;
  publish.disabled = true;
  fileInput.disabled = true;
  tokenInput.disabled = true;
  message('Публикуем фотографию… Не закрывайте страницу.');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    const existing = await fetch(`${endpoint}?ref=main`, {headers, cache: 'no-store'});
    if (!existing.ok) throw new Error(String(existing.status));
    const {sha} = await existing.json();
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {...headers, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        message: 'Update homepage photograph',
        branch: 'main', sha, content: prepared
      })
    });
    if (!response.ok) throw new Error(String(response.status));
    tokenInput.value = '';
    prepared = null;
    message('Фотография сохранена! GitHub публикует обновление — обычно это занимает несколько минут. После этого обновите главную страницу.');
  } catch (error) {
    const code = error.message;
    message(code === '409' || code === '422'
      ? 'Фото уже изменилось или GitHub отклонил обновление. Проверьте главную страницу и попробуйте ещё раз.'
      : ['401', '403', '404'].includes(code)
        ? 'Нет доступа к публикации. Проверьте срок токена, репозиторий Namiya и разрешение Contents: Read and write.'
        : 'Не удалось подтвердить публикацию. Проверьте соединение и главную страницу перед повторной попыткой.', true);
  } finally {
    busy = false;
    publish.disabled = !prepared;
    fileInput.disabled = false;
    tokenInput.disabled = false;
  }
});

window.addEventListener('beforeunload', event => {
  if (busy) { event.preventDefault(); event.returnValue = ''; }
});
