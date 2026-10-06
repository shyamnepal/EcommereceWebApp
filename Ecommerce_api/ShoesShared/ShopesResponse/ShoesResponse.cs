using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesShared.ShopesResponse
{
    public class ShoesResponse
    {
        public int ErrorCode { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
        public string Status { get; set; }
        public string Token { get; set; }
    }
}
