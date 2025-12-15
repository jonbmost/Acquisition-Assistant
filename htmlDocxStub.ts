const htmlDocx = {
  asBlob(html: string) {
    return new Blob([html], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }
};

export default htmlDocx;
