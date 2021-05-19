async function isApprover() {
  startLoad();
  const userId = domo.env.userId;
  const areApproved = await getInvDetails();
  domo.get(`/domo/users/v1/${userId}?includeDetails=true`)
  .then(data => {
    if(data.displayName === 'Kevin Larrivee' || data.displayName === 'Bill Johnston' || data.displayName === 'Ian Schembri') {
      approveBtn.style.display = 'block';
      if(areApproved.inv > 0) {
        unapproveBtn.style.display = 'block';
      } else {
        unapproveBtn.style.display = 'none';
      };
    } else {
      if(approveBtn) {
        approveBtn.remove();
      };
      if(unapproveBtn) {
        unapproveBtn.remove();
      };
    };
    endLoad();
  })
  .catch(err => console.log(err));
};