using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.ViewModel
{
    public class DeliveryMethodViewModel
    {
        [Required]
        public string ShortName { get; set; }
        [Required]
        public string DeliveryTime { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public decimal Price { get; set; }
        public DeliveryMethodViewModel(string shortName, string deliveryTime, string description, decimal price)
        {
           
            ShortName = shortName;
            DeliveryTime = deliveryTime;
            Description = description;
            Price = price;
        }
    }
}
