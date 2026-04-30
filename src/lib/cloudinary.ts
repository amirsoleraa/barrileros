const CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

/** Sube un archivo a Cloudinary y retorna la URL segura */
export async function uploadImage(file: File, folder = 'uploads'): Promise<string> {
  if (!CLOUD || !PRESET) throw new Error('Cloudinary no configurado — revisa VITE_CLOUDINARY_* en .env');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  fd.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) throw new Error(`Cloudinary error ${res.status}`);
  const data = await res.json();
  return data.secure_url as string;
}
