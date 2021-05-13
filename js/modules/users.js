function isApprover() {
  const userId = domo.env.userId;
  domo.get(`/domo/users/v1/${userId}?includeDetails=true`)
  .then(data => {
    if(data.displayName === 'Kevin Larrivee' || data.displayName === 'Bill Johnston') {
      approveBtn.style.display = 'block';
      return true;
    } else {
      if(approveBtn) {
        approveBtn.remove();
      };
      return false;
    };
  })
  .catch(err => console.log(err));
};