import {redirect} from 'react-router';

export async function loader() {
  console.log("DxB DEBUG account._index.tsx ----------------------------<<<<<<<<<<---");

  return redirect('/account/orders');
}
