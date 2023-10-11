import { Observable, of } from 'rxjs';
import { diskStorage } from 'multer';
import { v4 as uuidV4 } from 'uuid';

import fs from 'fs';

import path = require('path');

type validFileExtension = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

const validFileExtensions: validFileExtension[] = ['png', 'jpg', 'jpeg'];
const validMimeTypes: validMimeType[] = [
  'image/png',
  'image/jpg',
  'image/jpeg',
];

export const saveImageToStorage = {
  storage: diskStorage({
    destination: './images',
    filename: (req, file, cb) => {
      const fileExtension: string = path.extname(file.originalname);
      const fileName: string = uuidV4() + fileExtension;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes: validMimeType[] = validMimeTypes;
    allowedMimeTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
  },
};

// export const isFileExtensionSafe = (
//   fillFilePath: string,
// ): Observable<boolean> => {
//   return from(FileType.fileTypeFromFile(fillFilePath)).pipe(
//     switchMap(
//       (fileExtensionAndMimeType: {
//         ext: validFileExtension;
//         mime: validMimeType;
//       }) => {
//         if (!fileExtensionAndMimeType) {
//           return of(false);
//         }

//         const isFileTypeLegit = validFileExtensions.includes(
//           fileExtensionAndMimeType.ext,
//         );
//         const isMimeTypeLegit = validMimeTypes.includes(
//           fileExtensionAndMimeType.mime,
//         );

//         const isFileLegit = isFileTypeLegit && isMimeTypeLegit;

//         return of(isFileLegit);
//       },
//     ),
//   );
// };

// code lỏ
export const isFileExtensionSafe = (
  fullFilePath: string,
): Observable<boolean> => {
  const fileExtension: string = path.extname(fullFilePath).substring(1);
  const isExtensionValid = validFileExtensions.includes(
    fileExtension as validFileExtension,
  );

  return of(isExtensionValid);
};

export const removeFile = (fullFilePath: string): void => {
  try {
    fs.unlinkSync(fullFilePath);
  } catch (error) {
    console.log(error);
  }
};
