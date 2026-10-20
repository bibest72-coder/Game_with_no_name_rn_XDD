    const photoMap = {
      'image_5a5fbb91.png': '/assets/aistudio/image_5a5fbb91.svg',
      'image_fd2bab39.png': '/assets/aistudio/image_fd2bab39.svg',
    };
    
    const src = photoMap[img] ?? '/assets/aistudio/image_5a5fbb91.svg';
    
    return src;
