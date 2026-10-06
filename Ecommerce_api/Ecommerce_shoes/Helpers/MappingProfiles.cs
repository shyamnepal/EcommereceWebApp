using DataAcess.Entity;
using DataAcess.Entity.OrderAggregate;
using Ecommerce_shoes.Dtos;
using AutoMapper;

namespace Ecommerce_shoes.Helpers
{
    public class MappingProfiles: Profile
    {
        public MappingProfiles() 
        {
            CreateMap<Address, AddressDto>().ReverseMap();
        }
    }
}
