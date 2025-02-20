function getCategory(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const categories = {
        image: ['jpg', 'jpeg', 'png', 'gif'],
        document: ['pdf', 'doc', 'docx'],
        video: ['mp4', 'avi'],
        music: ['mp3', 'wav']
    };
    
    for (let category in categories) {
        if (categories[category].includes(ext)) {
            return category;
        }
    }
    return 'others';
}

module.exports.getCategory = (filename) => {
    if (filename.endsWith('.pdf')) return 'Documents';
    if (filename.endsWith('.jpg') || filename.endsWith('.png')) return 'Images';
    return 'Others';
};

